import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileUrl } = await req.json()
    const pdfcoApiKey = Deno.env.get('PDFCO_API_KEY')

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'No file URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!pdfcoApiKey) {
      return new Response(
        JSON.stringify({ error: 'PDF.co API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Starting invoice parsing for file:', fileUrl)

    // Parse the document directly without using profiles
    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser/parse', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        template: {
          "fields": [
            {
              "name": "Vendor",
              "type": "text",
              "regex": "(?:Company|Vendor|From):\\s*([^\\n]+)"
            },
            {
              "name": "InvoiceNumber",
              "type": "text",
              "regex": "(?:Invoice|Reference)\\s*(?:#|No\\.?|Number)?\\s*[:.]?\\s*(\\w+[-\\w]*)"
            },
            {
              "name": "InvoiceDate",
              "type": "date",
              "regex": "(?:Invoice|Date)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"
            },
            {
              "name": "DueDate",
              "type": "date",
              "regex": "(?:Due|Payment)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"
            },
            {
              "name": "TotalAmount",
              "type": "number",
              "regex": "(?:Total|Amount|Sum)\\s*(?:Due)?\\s*[:.]?\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{2})?)"
            },
            {
              "name": "Currency",
              "type": "text",
              "regex": "(USD|EUR|GBP|\\$|€|£)"
            }
          ],
          "tables": [
            {
              "name": "Items",
              "start": "(?:Item|Description|Product)",
              "end": "(?:Total|Sum|Subtotal)",
              "row": "^.+\\s+\\d+(?:[.,]\\d{2})?\\s*$",
              "columns": [
                {
                  "name": "Description",
                  "type": "text"
                },
                {
                  "name": "Amount",
                  "type": "number"
                }
              ]
            }
          ]
        },
        async: false,
        outputFormat: "json"
      })
    })

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text()
      console.error('Parse error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse document', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const parseResult = await parseResponse.json()
    console.log('Parse result:', parseResult)

    if (!parseResult?.success) {
      return new Response(
        JSON.stringify({ error: parseResult?.message || 'Failed to parse invoice' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get the parsed data
    const resultResponse = await fetch(parseResult.url, {
      headers: {
        'x-api-key': pdfcoApiKey,
      },
    })

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text()
      console.error('Result fetch error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch parse results', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const parsedData = await resultResponse.json()
    console.log('Parsed data:', parsedData)

    // Transform the data with safe fallbacks
    const transformedData = {
      vendor_name: parsedData.fields?.find((f: any) => f.name === 'Vendor')?.value || '',
      invoice_number: parsedData.fields?.find((f: any) => f.name === 'InvoiceNumber')?.value || '',
      invoice_date: parsedData.fields?.find((f: any) => f.name === 'InvoiceDate')?.value || null,
      due_date: parsedData.fields?.find((f: any) => f.name === 'DueDate')?.value || null,
      total_amount: parseFloat(parsedData.fields?.find((f: any) => f.name === 'TotalAmount')?.value || '0'),
      currency: parsedData.fields?.find((f: any) => f.name === 'Currency')?.value || 'USD',
      items: parsedData.tables?.find((t: any) => t.name === 'Items')?.rows || []
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