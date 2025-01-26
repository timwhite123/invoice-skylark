import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Extract file path from the public URL
    const filePath = fileUrl.split('/').slice(-1)[0]
    console.log('File path:', filePath)

    // Get signed URL that will work for external services
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('invoice-files')
      .createSignedUrl(filePath, 60)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      throw signedUrlError
    }

    console.log('Generated signed URL:', signedUrl)

    // Enhanced parsing template with improved regex patterns
    const template = {
      "templateName": "Enhanced Invoice Parser",
      "templateVersion": 2,
      "objects": [
        {
          "name": "vendor_name",
          "type": "field",
          "regex": "(?:Company|Vendor|From|Business|Supplier|Bill\\s*(?:To|From)|Billed\\s*(?:To|From))\\s*[:.]?\\s*([^\\n\\r]{2,50})",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "invoice_number",
          "type": "field",
          "regex": "(?:Invoice|Reference|Bill|Document|Order)\\s*(?:#|No\\.?|Number|ID)?\\s*[:.]?\\s*(\\w+[-\\w]*)",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "invoice_date",
          "type": "field",
          "regex": "(?:Invoice|Bill|Order|Document)?\\s*(?:Date)\\s*[:.]?\\s*(\\d{1,2}[-/.\\s]\\d{1,2}[-/.\\s]\\d{2,4}|\\d{4}[-/.\\s]\\d{1,2}[-/.\\s]\\d{1,2})",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "due_date",
          "type": "field",
          "regex": "(?:Due|Payment|Pay\\s*By|Expires?)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/.\\s]\\d{1,2}[-/.\\s]\\d{2,4}|\\d{4}[-/.\\s]\\d{1,2}[-/.\\s]\\d{1,2})",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "total_amount",
          "type": "field",
          "regex": "(?:Total|Amount|Sum|Balance|Due|Payable)\\s*(?:Due|Amount|Payable)?\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "currency",
          "type": "field",
          "regex": "(USD|EUR|GBP|\\$|€|£)",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "tax_amount",
          "type": "field",
          "regex": "(?:Tax|VAT|GST)\\s*(?:Amount)?\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        },
        {
          "name": "subtotal",
          "type": "field",
          "regex": "(?:Subtotal|Net\\s*Amount|Amount\\s*Before\\s*Tax)\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
          "options": {
            "multiline": true,
            "caseInsensitive": true
          }
        }
      ]
    }

    // Make the API request with proper JSON stringification
    const requestBody = {
      url: signedUrl,
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

    // Transform the parsed data with improved field handling
    const transformedData = {
      vendor_name: parseResult.fields?.find((f: any) => f.name === 'vendor_name')?.value?.trim() || '',
      invoice_number: parseResult.fields?.find((f: any) => f.name === 'invoice_number')?.value?.trim() || '',
      invoice_date: parseResult.fields?.find((f: any) => f.name === 'invoice_date')?.value?.trim() || null,
      due_date: parseResult.fields?.find((f: any) => f.name === 'due_date')?.value?.trim() || null,
      total_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'total_amount')?.value?.replace(/[^0-9.]/g, '') || '0'),
      currency: parseResult.fields?.find((f: any) => f.name === 'currency')?.value?.trim() || 'USD',
      tax_amount: parseFloat(parseResult.fields?.find((f: any) => f.name === 'tax_amount')?.value?.replace(/[^0-9.]/g, '') || '0'),
      subtotal: parseFloat(parseResult.fields?.find((f: any) => f.name === 'subtotal')?.value?.replace(/[^0-9.]/g, '') || '0'),
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