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
      const error = !fileUrl ? 'No file URL provided' : 'OpenAI API key not configured'
      console.error('Missing required parameters:', { fileUrl: !!fileUrl, openAiApiKey: !!openAiApiKey })
      return new Response(
        JSON.stringify({ error, details: !fileUrl ? 'fileUrl is required' : 'OpenAI API key is not set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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

    const pdfResponse = await fetch(signedUrl)
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch PDF', details: `HTTP ${pdfResponse.status}: ${pdfResponse.statusText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))

    console.log('Calling OpenAI API...')
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert invoice parser. Extract and return invoice details in this exact JSON format:
            {
              "vendor_name": "string",
              "invoice_number": "string",
              "invoice_date": "YYYY-MM-DD",
              "due_date": "YYYY-MM-DD",
              "total_amount": number,
              "currency": "string",
              "payment_terms": "string",
              "purchase_order_number": "string",
              "billing_address": "string",
              "shipping_address": "string",
              "notes": "string",
              "tax_amount": number,
              "subtotal": number,
              "line_items": [
                {
                  "description": "string",
                  "quantity": number,
                  "unit_price": number,
                  "total": number
                }
              ]
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the invoice information from this PDF and return it in the specified JSON format. Ensure all dates are in YYYY-MM-DD format and all numeric values are numbers, not strings."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    })

    if (!openAiResponse.ok) {
      const error = await openAiResponse.text()
      console.error('OpenAI API error response:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process invoice with OpenAI',
          details: `OpenAI API returned ${openAiResponse.status}: ${error}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openAiData = await openAiResponse.json()
    console.log('OpenAI raw response:', openAiData)

    if (!openAiData.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', openAiData)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from OpenAI',
          details: 'The API response did not contain the expected data structure'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let parsedData
    try {
      parsedData = JSON.parse(openAiData.choices[0].message.content)
    } catch (e) {
      console.error('Error parsing OpenAI response as JSON:', e, 'Raw content:', openAiData.choices[0].message.content)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse OpenAI response as JSON',
          details: e.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Successfully parsed OpenAI response:', parsedData)

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error parsing invoice:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred while parsing the invoice',
        details: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})