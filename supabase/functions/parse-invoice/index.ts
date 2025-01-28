import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileUrl } = await req.json()
    const pdfcoApiKey = Deno.env.get('PDFCO_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Starting parse-invoice function with fileUrl:', fileUrl)

    if (!fileUrl || !pdfcoApiKey) {
      console.error('Missing required parameters:', { fileUrl: !!fileUrl, pdfcoApiKey: !!pdfcoApiKey })
      return new Response(
        JSON.stringify({ error: !fileUrl ? 'No file URL provided' : 'PDF.co API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: !fileUrl ? 400 : 500 }
      )
    }

    console.log('Creating Supabase client and generating signed URL')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
    const filePath = fileUrl.split('/').slice(-1)[0]
    
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('invoice-files')
      .createSignedUrl(filePath, 60)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate signed URL', details: signedUrlError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Generated signed URL:', signedUrl)

    // First try to parse using the PDF.co AI extractor
    console.log('Attempting to parse with PDF.co AI extractor...')
    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: signedUrl,
        async: false,
        parseType: "Invoice",
        templateName: "Auto",
        outputFormat: "JSON"
      })
    })

    console.log('PDF.co response status:', parseResponse.status)
    const parseResult = await parseResponse.json()
    console.log('PDF.co raw response:', parseResult)

    if (!parseResponse.ok || parseResult.error === true) {
      console.error('Parse error:', parseResult)
      
      // Try fallback to text extraction if AI parsing fails
      console.log('AI parsing failed, attempting text extraction...')
      const textResponse = await fetch('https://api.pdf.co/v1/pdf/text', {
        method: 'POST',
        headers: {
          'x-api-key': pdfcoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: signedUrl,
          async: false,
          inline: false
        })
      })

      if (!textResponse.ok) {
        console.error('Text extraction failed:', await textResponse.json())
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse document', 
            details: parseResult 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      const textResult = await textResponse.json()
      console.log('Text extraction result:', textResult)

      // Extract basic information from text using regex patterns
      const text = textResult.text || ''
      const invoiceNumberMatch = text.match(/(?:Invoice|Reference|Bill)\s*(?:#|No|Number|ID)?[:\s]+([A-Z0-9-]+)/i)
      const dateMatch = text.match(/(?:Date|Invoice Date)[:\s]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i)
      const amountMatch = text.match(/(?:Total|Amount Due|Balance)[:\s]*[$€£]?([\d,]+\.?\d{0,2})/i)
      const vendorMatch = text.match(/(?:From|Company|Vendor|Business Name)[:\s]+([^\n]{2,50})/i)

      const transformedData = {
        vendor_name: vendorMatch?.[1]?.trim() || '',
        invoice_number: invoiceNumberMatch?.[1]?.trim() || '',
        invoice_date: dateMatch?.[1] || null,
        due_date: null,
        total_amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
        currency: text.includes('€') ? 'EUR' : text.includes('£') ? 'GBP' : 'USD',
        subtotal: 0,
        tax_amount: 0
      }

      console.log('Extracted data from text:', transformedData)
      return new Response(
        JSON.stringify(transformedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract and transform the parsed data from successful AI parsing
    const fields = parseResult.body || {}
    console.log('Extracted raw fields:', fields)

    const transformedData = {
      vendor_name: fields.Vendor || fields.vendor_name || fields.Company || '',
      invoice_number: fields.InvoiceNumber || fields.invoice_number || fields.Reference || '',
      invoice_date: fields.InvoiceDate || fields.invoice_date || fields.Date || null,
      due_date: fields.DueDate || fields.due_date || null,
      total_amount: parseFloat(fields.TotalAmount || fields.total_amount || fields.Total || '0'),
      currency: fields.Currency || fields.currency || 'USD',
      subtotal: parseFloat(fields.Subtotal || fields.subtotal || '0'),
      tax_amount: parseFloat(fields.Tax || fields.tax_amount || '0')
    }

    console.log('Transformed data being returned:', transformedData)

    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error parsing invoice:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred while parsing the invoice',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})