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
    
    const stringifiedTemplate = JSON.stringify(invoiceTemplate)
    console.log('Using template:', stringifiedTemplate)

    // First, try with built-in profiles
    console.log('Attempting to parse with built-in profiles...')
    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: signedUrl,
        async: false,
        profiles: true,
        outputFormat: 'JSON'
      })
    })

    console.log('PDF.co response status:', parseResponse.status)
    const parseResult = await parseResponse.json()
    console.log('PDF.co raw response:', parseResult)

    // If built-in profiles fail, try with our custom template
    if (!parseResponse.ok || !parseResult.objects || parseResult.objects.length === 0) {
      console.log('Built-in profiles failed, trying with custom template...')
      const customParseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
        method: 'POST',
        headers: {
          'x-api-key': pdfcoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: signedUrl,
          async: false,
          template: stringifiedTemplate,
          profiles: false,
          outputFormat: 'JSON'
        })
      })

      console.log('Custom template PDF.co response status:', customParseResponse.status)
      const customParseResult = await customParseResponse.json()
      console.log('Custom template PDF.co raw response:', customParseResult)

      if (!customParseResponse.ok) {
        console.error('Parse error:', customParseResult)
        return new Response(
          JSON.stringify({ error: 'Failed to parse document', details: customParseResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: customParseResponse.status }
        )
      }

      if (!customParseResult.objects || customParseResult.objects.length === 0) {
        console.error('No fields extracted from document')
        return new Response(
          JSON.stringify({ 
            error: 'No data could be extracted from the document',
            details: 'The PDF parser could not find any matching fields in the document. Please check if the PDF is text-based and not scanned.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 }
        )
      }

      parseResult = customParseResult
    }

    // Extract fields from the parse result
    const fields = parseResult.objects[0].fields || {}
    console.log('Extracted raw fields:', fields)

    // Map the extracted fields to our expected format
    const transformedData = {
      vendor_name: fields.vendor_name?.value || '',
      invoice_number: fields.invoice_number?.value || '',
      invoice_date: fields.invoice_date?.value || null,
      total_amount: parseFloat(fields.total_amount?.value || '0'),
      currency: 'USD', // Default to USD for now
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