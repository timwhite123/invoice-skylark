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

    if (!fileUrl || !pdfcoApiKey) {
      console.error('Missing required parameters:', { fileUrl: !!fileUrl, pdfcoApiKey: !!pdfcoApiKey })
      return new Response(
        JSON.stringify({ error: !fileUrl ? 'No file URL provided' : 'PDF.co API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: !fileUrl ? 400 : 500 }
      )
    }

    console.log('Starting invoice parsing for file:', fileUrl)
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
    const filePath = fileUrl.split('/').slice(-1)[0]
    
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('invoice-files')
      .createSignedUrl(filePath, 60)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      throw signedUrlError
    }

    console.log('Generated signed URL:', signedUrl)

    const requestBody = {
      url: signedUrl,
      async: false,
      name: "invoice.pdf",
      language: "eng",
      pages: ""
    }

    console.log('Sending request to PDF.co:', JSON.stringify(requestBody))

    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/invoice/parser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('PDF.co response status:', parseResponse.status)
    const parseResult = await parseResponse.json()
    console.log('PDF.co parse result:', parseResult)

    if (!parseResponse.ok) {
      console.error('Parse error:', parseResult)
      return new Response(
        JSON.stringify({ error: 'Failed to parse document', details: parseResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: parseResponse.status }
      )
    }

    // Extract fields from the parse result
    // The AI Invoice Parser returns data in a different format than document parser
    const fields = parseResult.body || {}
    console.log('Extracted fields:', fields)

    const transformedData = {
      vendor_name: fields.vendor?.name || '',
      invoice_number: fields.invoiceId || '',
      invoice_date: fields.invoiceDate || null,
      due_date: fields.dueDate || null,
      total_amount: parseFloat(fields.total?.toString() || '0'),
      currency: fields.currency || 'USD',
      tax_amount: parseFloat(fields.tax?.toString() || '0'),
      subtotal: parseFloat(fields.subtotal?.toString() || '0'),
      payment_terms: fields.paymentTerms || '',
      purchase_order_number: fields.purchaseOrder || '',
      billing_address: fields.billingAddress?.full || '',
      shipping_address: fields.shippingAddress?.full || '',
      payment_method: fields.paymentMethod || '',
      discount_amount: parseFloat(fields.discount?.toString() || '0'),
      additional_fees: parseFloat(fields.additionalCharges?.toString() || '0'),
      notes: fields.notes || '',
    }

    console.log('Transformed data:', transformedData)

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