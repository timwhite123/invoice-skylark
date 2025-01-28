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

    if (!fileUrl || !pdfcoApiKey) {
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
      template: JSON.stringify(invoiceTemplate),
      async: false,
      name: "invoice.pdf"
    }

    console.log('Sending request to PDF.co:', JSON.stringify(requestBody))

    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
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

    const transformedData = {
      vendor_name: parseResult.fields?.find((f: any) => f.name === 'vendor_name')?.value?.trim() || '',
      invoice_number: parseResult.fields?.find((f: any) => f.name === 'invoice_number')?.value?.trim() || '',
      invoice_date: parseResult.fields?.find((f: any) => f.name === 'invoice_date')?.value?.trim() || null,
      due_date: parseResult.fields?.find((f: any) => f.name === 'due_date')?.value?.trim() || null,
      total_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'total_amount')?.value?.replace(/[^0-9.]/g, '') || '0'),
      currency: parseResult.fields?.find((f: any) => f.name === 'currency')?.value?.trim() || 'USD',
      tax_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'tax_amount')?.value?.replace(/[^0-9.]/g, '') || '0'),
      subtotal: parseFloat(parseResult.fields?.find((f: any) => f.name === 'subtotal')?.value?.replace(/[^0-9.]/g, '') || '0'),
      payment_terms: parseResult.fields?.find((f: any) => f.name === 'payment_terms')?.value?.trim() || '',
      purchase_order_number: parseResult.fields?.find((f: any) => f.name === 'purchase_order_number')?.value?.trim() || '',
      billing_address: parseResult.fields?.find((f: any) => f.name === 'billing_address')?.value?.trim() || '',
      shipping_address: parseResult.fields?.find((f: any) => f.name === 'shipping_address')?.value?.trim() || '',
      payment_method: parseResult.fields?.find((f: any) => f.name === 'payment_method')?.value?.trim() || '',
      discount_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'discount_amount')?.value?.replace(/[^0-9.]/g, '') || '0'),
      additional_fees: parseFloat(parseResult.fields?.find((f: any) => f.name === 'additional_fees')?.value?.replace(/[^0-9.]/g, '') || '0'),
      notes: parseResult.fields?.find((f: any) => f.name === 'notes')?.value?.trim() || '',
    }

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