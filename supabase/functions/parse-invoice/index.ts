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
        JSON.stringify({ 
          error: !fileUrl ? 'No file URL provided' : 'OpenAI API key not configured',
          details: !fileUrl ? 'fileUrl is required' : 'OpenAI API key is not set in environment variables'
        }),
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
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch PDF', details: `HTTP ${pdfResponse.status}: ${pdfResponse.statusText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))

    const systemPrompt = `You are an expert invoice parser. Given the raw text of an invoice, please extract and return the key invoice details in a structured JSON format that strictly follows the schema provided below.

Invoice Schema:
{
  "InvoiceID": "string",
  "InvoiceNumber": "string",
  "InvoiceDate": "YYYY-MM-DD",
  "DueDate": "YYYY-MM-DD",
  "SupplierName": "string",
  "SupplierAddress": "string",
  "SupplierContact": "string",
  "SupplierEmail": "string",
  "CustomerName": "string",
  "CustomerAddress": "string",
  "CustomerContact": "string",
  "CustomerEmail": "string",
  "PONumber": "string",
  "PaymentTerms": "string",
  "Currency": "string",
  "SubTotal": number,
  "TaxTotal": number,
  "TaxPercentage": number,
  "InvoiceTotal": number,
  "Notes": "string",
  "LineItems": [
    {
      "Description": "string",
      "Quantity": number,
      "UnitPrice": number,
      "LineTotal": number,
      "TaxAmount": number
    }
  ]
}

Your output must be a valid JSON object that adheres exactly to the schema above. Ensure that:
* Dates are in YYYY-MM-DD format
* Numeric fields (SubTotal, TaxTotal, TaxPercentage, InvoiceTotal, Quantity, UnitPrice, LineTotal, TaxAmount) are represented as numbers (not strings)
* Only output the JSON object with no additional commentary or explanation`

    // Call OpenAI API with the PDF content
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
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract the invoice information from this PDF and return it in the specified JSON format."
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

    // Parse the OpenAI response to extract structured data
    const content = openAiData.choices[0].message.content
    
    let parsedData
    try {
      parsedData = JSON.parse(content)
    } catch (e) {
      console.error('Error parsing OpenAI response as JSON:', e, 'Raw content:', content)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse OpenAI response as JSON',
          details: e.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Transform the parsed data to match our database schema
    const transformedData = {
      vendor_name: parsedData.SupplierName,
      invoice_number: parsedData.InvoiceNumber,
      invoice_date: parsedData.InvoiceDate,
      due_date: parsedData.DueDate,
      total_amount: parsedData.InvoiceTotal,
      currency: parsedData.Currency,
      payment_terms: parsedData.PaymentTerms,
      purchase_order_number: parsedData.PONumber,
      billing_address: parsedData.CustomerAddress,
      shipping_address: parsedData.SupplierAddress,
      notes: parsedData.Notes,
      tax_amount: parsedData.TaxTotal,
      subtotal: parsedData.SubTotal,
      line_items: parsedData.LineItems
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
        details: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})