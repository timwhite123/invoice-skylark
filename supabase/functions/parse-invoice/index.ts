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
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Starting parse-invoice function with fileUrl:', fileUrl)

    if (!fileUrl || !openAiApiKey) {
      console.error('Missing required parameters:', { fileUrl: !!fileUrl, openAiApiKey: !!openAiApiKey })
      return new Response(
        JSON.stringify({ error: !fileUrl ? 'No file URL provided' : 'OpenAI API key not configured' }),
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

    // Convert PDF to base64
    const pdfResponse = await fetch(signedUrl)
    const pdfBuffer = await pdfResponse.arrayBuffer()
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))

    // Call OpenAI API with the PDF content
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting information from invoices. Extract all relevant information and return it in a structured format."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract the following information from this invoice PDF: vendor name, invoice number, invoice date, due date, total amount, currency, tax amount, and subtotal. Return the data in a structured format."
              },
              {
                type: "image",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    })

    if (!openAiResponse.ok) {
      const error = await openAiResponse.json()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to process invoice with OpenAI')
    }

    const openAiData = await openAiResponse.json()
    console.log('OpenAI raw response:', openAiData)

    // Parse the OpenAI response to extract structured data
    const content = openAiData.choices[0].message.content
    
    // Convert the OpenAI response into our expected format
    let extractedData
    try {
      // Try to parse as JSON first
      extractedData = JSON.parse(content)
    } catch (e) {
      // If not JSON, try to extract information using regex
      console.log('Parsing OpenAI response as text:', content)
      const vendorMatch = content.match(/vendor(?:\s?name)?:\s*([^\n]+)/i)
      const invoiceNumberMatch = content.match(/invoice(?:\s?number)?:\s*([^\n]+)/i)
      const invoiceDateMatch = content.match(/invoice(?:\s?date)?:\s*([^\n]+)/i)
      const dueDateMatch = content.match(/due(?:\s?date)?:\s*([^\n]+)/i)
      const totalMatch = content.match(/total(?:\s?amount)?:\s*[\$€£]?([\d,]+\.?\d{0,2})/i)
      const currencyMatch = content.match(/currency:\s*([^\n]+)/i)
      const taxMatch = content.match(/tax(?:\s?amount)?:\s*[\$€£]?([\d,]+\.?\d{0,2})/i)
      const subtotalMatch = content.match(/subtotal:\s*[\$€£]?([\d,]+\.?\d{0,2})/i)

      extractedData = {
        vendor_name: vendorMatch?.[1]?.trim() || '',
        invoice_number: invoiceNumberMatch?.[1]?.trim() || '',
        invoice_date: invoiceDateMatch?.[1]?.trim() || null,
        due_date: dueDateMatch?.[1]?.trim() || null,
        total_amount: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0,
        currency: currencyMatch?.[1]?.trim() || 'USD',
        tax_amount: taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0,
        subtotal: subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0
      }
    }

    console.log('Extracted and transformed data:', extractedData)

    return new Response(
      JSON.stringify(extractedData),
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