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

    // Define the parsing template
    const template = {
      fields: [
        {
          name: "Vendor",
          type: "text",
          regex: "(?:Company|Vendor|From):\\s*([^\\n]+)"
        },
        {
          name: "InvoiceNumber",
          type: "text",
          regex: "(?:Invoice|Reference)\\s*(?:#|No\\.?|Number)?\\s*[:.]?\\s*(\\w+[-\\w]*)"
        },
        {
          name: "InvoiceDate",
          type: "date",
          regex: "(?:Invoice|Date)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"
        },
        {
          name: "DueDate",
          type: "date",
          regex: "(?:Due|Payment)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"
        },
        {
          name: "TotalAmount",
          type: "number",
          regex: "(?:Total|Amount|Sum)\\s*(?:Due)?\\s*[:.]?\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{2})?)"
        },
        {
          name: "Currency",
          type: "text",
          regex: "(USD|EUR|GBP|\\$|€|£)"
        }
      ],
      tables: [
        {
          name: "Items",
          start: "(?:Item|Description|Product)",
          end: "(?:Total|Sum|Subtotal)",
          row: "^.+\\s+\\d+(?:[.,]\\d{2})?\\s*$",
          columns: [
            {
              name: "Description",
              type: "text"
            },
            {
              name: "Amount",
              type: "number"
            }
          ]
        }
      ]
    }

    // Make the API request with proper JSON stringification
    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        template: template,
        async: false,
        outputFormat: "json"
      })
    })

    console.log('PDF.co response status:', parseResponse.status)
    const parseResult = await parseResponse.json()
    console.log('PDF.co parse result:', parseResult)

    if (!parseResponse.ok) {
      console.error('Parse error:', parseResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse document', 
          details: parseResult 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: parseResponse.status 
        }
      )
    }

    // Transform the parsed data
    const transformedData = {
      vendor_name: parseResult.fields?.find((f: any) => f.name === 'Vendor')?.value || '',
      invoice_number: parseResult.fields?.find((f: any) => f.name === 'InvoiceNumber')?.value || '',
      invoice_date: parseResult.fields?.find((f: any) => f.name === 'InvoiceDate')?.value || null,
      due_date: parseResult.fields?.find((f: any) => f.name === 'DueDate')?.value || null,
      total_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'TotalAmount')?.value || '0'),
      currency: parseResult.fields?.find((f: any) => f.name === 'Currency')?.value || 'USD',
      items: parseResult.tables?.find((t: any) => t.name === 'Items')?.rows || []
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