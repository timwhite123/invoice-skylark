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

    // Create a more detailed template for invoice parsing
    const template = {
      "profiles": [{
        "name": "invoice",
        "fields": [
          {
            "name": "vendor_name",
            "type": "field",
            "regex": "(?:Company|Vendor|From|Business|Supplier)\\s*(?:Name)?:\\s*([^\\n]+)"
          },
          {
            "name": "invoice_number",
            "type": "field",
            "regex": "(?:Invoice|Reference|Document)\\s*(?:Number|ID|#)?:\\s*([^\\n]+)"
          },
          {
            "name": "invoice_date",
            "type": "field",
            "regex": "(?:Invoice|Document)\\s*Date:\\s*([^\\n]+)"
          },
          {
            "name": "due_date",
            "type": "field",
            "regex": "Due\\s*Date:\\s*([^\\n]+)"
          },
          {
            "name": "total_amount",
            "type": "field",
            "regex": "(?:Total|Amount Due|Grand Total):\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{2})?)"
          },
          {
            "name": "subtotal",
            "type": "field",
            "regex": "(?:Subtotal|Net Amount):\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{2})?)"
          },
          {
            "name": "tax_amount",
            "type": "field",
            "regex": "(?:Tax|VAT|GST):\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{2})?)"
          },
          {
            "name": "currency",
            "type": "field",
            "regex": "Currency:\\s*([A-Z]{3})"
          }
        ]
      }]
    }

    console.log('Sending request to PDF.co with template:', JSON.stringify(template))

    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: signedUrl,
        async: false,
        template: JSON.stringify(template)
      })
    })

    console.log('PDF.co response status:', parseResponse.status)
    const parseResult = await parseResponse.json()
    console.log('PDF.co raw response:', parseResult)

    if (!parseResponse.ok) {
      console.error('Parse error:', parseResult)
      return new Response(
        JSON.stringify({ error: 'Failed to parse document', details: parseResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: parseResponse.status }
      )
    }

    // Extract fields from the parse result
    const fields = parseResult.body || {}
    console.log('Extracted raw fields:', fields)

    const transformedData = {
      vendor_name: fields.vendor_name || '',
      invoice_number: fields.invoice_number || '',
      invoice_date: fields.invoice_date || null,
      due_date: fields.due_date || null,
      total_amount: parseFloat(fields.total_amount?.toString() || '0'),
      currency: fields.currency || 'USD',
      tax_amount: parseFloat(fields.tax_amount?.toString() || '0'),
      subtotal: parseFloat(fields.subtotal?.toString() || '0'),
      payment_terms: fields.payment_terms || '',
      purchase_order_number: fields.purchase_order_number || '',
      billing_address: fields.billing_address || '',
      shipping_address: fields.shipping_address || '',
      payment_method: fields.payment_method || '',
      discount_amount: parseFloat(fields.discount_amount?.toString() || '0'),
      additional_fees: parseFloat(fields.additional_fees?.toString() || '0'),
      notes: fields.notes || '',
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