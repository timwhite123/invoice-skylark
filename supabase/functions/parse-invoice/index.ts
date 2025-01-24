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
      "templateName": "Invoice Parser",
      "templateVersion": 1,
      "objects": [
        {
          "name": "vendor_name",
          "type": "field",
          "regex": "(?:Company|Vendor|From):\\s*([^\\n]+)"
        },
        {
          "name": "invoice_number",
          "type": "field",
          "regex": "(?:Invoice|Reference)\\s*(?:#|No\\.?|Number)?\\s*[:.]?\\s*(\\w+[-\\w]*)"
        },
        {
          "name": "invoice_date",
          "type": "field",
          "regex": "(?:Invoice|Date)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"
        },
        {
          "name": "due_date",
          "type": "field",
          "regex": "(?:Due|Payment)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"
        },
        {
          "name": "total_amount",
          "type": "field",
          "regex": "(?:Total|Amount|Sum)\\s*(?:Due)?\\s*[:.]?\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{2})?)"
        },
        {
          "name": "currency",
          "type": "field",
          "regex": "(USD|EUR|GBP|\\$|€|£)"
        }
      ]
    }

    // Make the API request with proper JSON stringification
    const requestBody = {
      url: fileUrl,
      template: JSON.stringify(template),
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
      vendor_name: parseResult.fields?.find((f: any) => f.name === 'vendor_name')?.value || '',
      invoice_number: parseResult.fields?.find((f: any) => f.name === 'invoice_number')?.value || '',
      invoice_date: parseResult.fields?.find((f: any) => f.name === 'invoice_date')?.value || null,
      due_date: parseResult.fields?.find((f: any) => f.name === 'due_date')?.value || null,
      total_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'total_amount')?.value || '0'),
      currency: parseResult.fields?.find((f: any) => f.name === 'currency')?.value || 'USD',
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