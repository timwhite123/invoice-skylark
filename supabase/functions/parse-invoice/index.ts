import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createCanvas, Image } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.mjs";

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
    
    if (!fileUrl) {
      throw new Error('No file URL provided')
    }

    console.log('Processing invoice from URL:', fileUrl)

    // Fetch the PDF file
    const pdfResponse = await fetch(fileUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF file')
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()
    
    // Initialize PDF.js with the worker
    const pdfjsWorker = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker.PDFWorker();
    
    // Load the PDF using pdf.js
    const loadingTask = new pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // Set dimensions
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to base64 image
    const base64Image = canvas.toDataURL('image/jpeg');
    console.log('Successfully converted PDF to image');

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this invoice and extract the following information in JSON format:
                - vendor_name
                - invoice_number
                - invoice_date
                - due_date
                - total_amount
                - currency
                - payment_terms
                - purchase_order_number
                - billing_address
                - shipping_address
                - notes
                - payment_method
                - discount_amount
                - additional_fees
                - tax_amount
                - subtotal

                Please return ONLY the JSON object with these fields, nothing else. Use null for missing values.
                Format dates as YYYY-MM-DD strings.
                Format all monetary values as numbers without currency symbols.`
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0
      })
    })

    if (!openAiResponse.ok) {
      const error = await openAiResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openAiData = await openAiResponse.json()
    
    if (!openAiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI')
    }

    let parsedData
    try {
      parsedData = JSON.parse(openAiData.choices[0].message.content)
      console.log('Successfully parsed invoice data:', parsedData)
    } catch (e) {
      console.error('Error parsing OpenAI response as JSON:', e)
      throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`)
    }

    return new Response(
      JSON.stringify(parsedData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error processing invoice:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process invoice',
        details: error.message
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})