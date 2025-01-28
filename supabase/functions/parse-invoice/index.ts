import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { invoiceTemplate } from './template.ts'

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
    console.log('Using template:', JSON.stringify(invoiceTemplate, null, 2))

    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: signedUrl,
        async: false,
        template: invoiceTemplate
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
    const fields = parseResult.objects?.[0]?.fields || {}
    console.log('Extracted raw fields:', fields)

    // Map the extracted fields to our expected format
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