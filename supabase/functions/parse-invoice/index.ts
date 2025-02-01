import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are an expert invoice parser. Extract and return the key invoice details in a structured JSON format strictly following this schema:

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

Ensure:
* Dates are in YYYY-MM-DD format. If the date format is ambiguous (e.g., "01/02/2023"), try to infer the correct format based on the context.
* Numeric fields (SubTotal, TaxTotal, TaxPercentage, InvoiceTotal, Quantity, UnitPrice, LineTotal, TaxAmount) are numbers (not strings).
* If a field cannot be extracted, return 'N/A' for that field.
* Respond with JSON only, no extra text.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting invoice parsing process...')
    const { fileUrl } = await req.json()
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

    console.log('Creating Supabase client and fetching file content...')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
    
    // Download the file content
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    // Convert the image to base64
    const imageBuffer = await response.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

    console.log('Sending image to OpenAI for analysis...')
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
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the invoice information from this image and return it in the specified JSON format."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
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

    // Convert to different formats
    const textFormat = convertToText(parsedData)
    const csvFormat = convertToCSV(parsedData)
    const jsonFormat = JSON.stringify(parsedData, null, 2)

    // Store the parsed data in Supabase
    const { error: dbError } = await supabase
      .from('invoices')
      .insert({
        user_id: req.headers.get('x-user-id'),
        vendor_name: parsedData.SupplierName,
        invoice_number: parsedData.InvoiceNumber,
        invoice_date: parsedData.InvoiceDate,
        due_date: parsedData.DueDate,
        total_amount: parsedData.InvoiceTotal,
        currency: parsedData.Currency,
        status: 'pending',
        original_file_url: fileUrl,
        payment_terms: parsedData.PaymentTerms,
        purchase_order_number: parsedData.PONumber,
        billing_address: parsedData.CustomerAddress,
        shipping_address: parsedData.SupplierAddress,
        notes: parsedData.Notes,
        tax_amount: parsedData.TaxTotal,
        subtotal: parsedData.SubTotal
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save invoice data: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        formats: {
          text: textFormat,
          csv: csvFormat,
          json: jsonFormat
        }
      }),
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

function convertToText(data: any): string {
  let text = `Invoice Details\n\n`
  text += `Invoice Number: ${data.InvoiceNumber}\n`
  text += `Date: ${data.InvoiceDate}\n`
  text += `Due Date: ${data.DueDate}\n\n`
  
  text += `Supplier Information\n`
  text += `Name: ${data.SupplierName}\n`
  text += `Address: ${data.SupplierAddress}\n`
  text += `Contact: ${data.SupplierContact}\n`
  text += `Email: ${data.SupplierEmail}\n\n`
  
  text += `Customer Information\n`
  text += `Name: ${data.CustomerName}\n`
  text += `Address: ${data.CustomerAddress}\n`
  text += `Contact: ${data.CustomerContact}\n`
  text += `Email: ${data.CustomerEmail}\n\n`
  
  text += `Financial Details\n`
  text += `Currency: ${data.Currency}\n`
  text += `Subtotal: ${data.SubTotal}\n`
  text += `Tax (${data.TaxPercentage}%): ${data.TaxTotal}\n`
  text += `Total Amount: ${data.InvoiceTotal}\n\n`
  
  text += `Line Items:\n`
  data.LineItems.forEach((item: any, index: number) => {
    text += `${index + 1}. ${item.Description}\n`
    text += `   Quantity: ${item.Quantity}\n`
    text += `   Unit Price: ${item.UnitPrice}\n`
    text += `   Line Total: ${item.LineTotal}\n`
    text += `   Tax Amount: ${item.TaxAmount}\n\n`
  })
  
  if (data.Notes) {
    text += `Notes: ${data.Notes}\n`
  }
  
  return text
}

function convertToCSV(data: any): string {
  const header = [
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Supplier Name',
    'Customer Name',
    'Currency',
    'Subtotal',
    'Tax Total',
    'Invoice Total'
  ].join(',')
  
  const row = [
    data.InvoiceNumber,
    data.InvoiceDate,
    data.DueDate,
    data.SupplierName,
    data.CustomerName,
    data.Currency,
    data.SubTotal,
    data.TaxTotal,
    data.InvoiceTotal
  ].join(',')
  
  return `${header}\n${row}`
}