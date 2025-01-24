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

    // First, get the parsing profile ID from PDF.co
    const profileResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser/profiles', {
      method: 'GET',
      headers: {
        'x-api-key': pdfcoApiKey,
      },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('Profile fetch error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch parsing profiles', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const profiles = await profileResponse.json()
    console.log('Profiles response:', profiles)

    if (!profiles?.profiles?.length) {
      return new Response(
        JSON.stringify({ error: 'No parsing profiles found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const invoiceProfile = profiles.profiles.find((p: any) => p.name === 'Invoice')
    if (!invoiceProfile?.id) {
      return new Response(
        JSON.stringify({ error: 'Invoice parsing profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Parse the document using the profile
    const parseResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        profileId: invoiceProfile.id,
        async: false
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

    if (!parsedData?.fields) {
      return new Response(
        JSON.stringify({ error: 'Invalid parsed data format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Transform the data with safe fallbacks
    const transformedData = {
      vendor_name: parsedData.fields.find((f: any) => f.name === 'Vendor')?.value || '',
      invoice_number: parsedData.fields.find((f: any) => f.name === 'InvoiceNumber')?.value || '',
      invoice_date: parsedData.fields.find((f: any) => f.name === 'InvoiceDate')?.value || null,
      due_date: parsedData.fields.find((f: any) => f.name === 'DueDate')?.value || null,
      total_amount: parseFloat(parsedData.fields.find((f: any) => f.name === 'TotalAmount')?.value || '0'),
      currency: parsedData.fields.find((f: any) => f.name === 'Currency')?.value || 'USD',
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