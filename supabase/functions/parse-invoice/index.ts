import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting invoice parsing process...')
    const { fileUrl } = await req.json()
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!fileUrl || !openAiApiKey) {
      const error = !fileUrl ? 'No file URL provided' : 'OpenAI API key not configured'
      console.error('Missing required parameters:', { fileUrl: !!fileUrl, openAiApiKey: !!openAiApiKey })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process invoice',
          details: error
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Download the PDF file
    console.log('Downloading PDF from URL:', fileUrl)
    const pdfResponse = await fetch(fileUrl)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`)
    }
    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Convert PDF to PNG using canvas
    console.log('Converting PDF to PNG...')
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      throw new Error('PDF document has no pages')
    }

    // Get the first page
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Create a canvas with the PDF dimensions
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Convert canvas to PNG data URL
    const pngDataUrl = canvas.toDataURL('image/png')

    console.log('Sending PNG to OpenAI for analysis...')
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
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
                text: "Extract the invoice information from this file and return it in the specified JSON format. Ensure all dates are in YYYY-MM-DD format and all numeric values are numbers, not strings."
              },
              {
                type: "image_url",
                image_url: {
                  url: pngDataUrl,
                  detail: "high"
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
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API returned ${openAiResponse.status}: ${error}`)
    }

    const openAiData = await openAiResponse.json()
    console.log('Received response from OpenAI:', openAiData)

    if (!openAiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI')
    }

    let parsedData
    try {
      parsedData = JSON.parse(openAiData.choices[0].message.content)
    } catch (e) {
      console.error('Error parsing OpenAI response as JSON:', e)
      throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`)
    }

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in parse-invoice function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process invoice',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})