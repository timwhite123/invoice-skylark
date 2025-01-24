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
      throw new Error('No file URL provided')
    }

    if (!pdfcoApiKey) {
      throw new Error('PDF.co API key not configured')
    }

    console.log('Starting invoice parsing for file:', fileUrl)

    // First, we need to get the parsing profile ID from PDF.co
    const profileResponse = await fetch('https://api.pdf.co/v1/pdf/documentparser/profiles', {
      method: 'GET',
      headers: {
        'x-api-key': pdfcoApiKey,
      },
    })

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profiles: ${await profileResponse.text()}`)
    }

    const profiles = await profileResponse.json()
    console.log('Profiles response:', profiles)

    if (!profiles?.profiles) {
      throw new Error('Invalid profiles response from PDF.co')
    }

    const invoiceProfile = profiles.profiles.find((p: any) => p.name === 'Invoice')
    if (!invoiceProfile?.id) {
      throw new Error('Invoice parsing profile not found')
    }

    // Now we can parse the document using the profile
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
      throw new Error(`Failed to parse document: ${await parseResponse.text()}`)
    }

    const parseResult = await parseResponse.json()
    console.log('Parse result:', parseResult)

    if (!parseResult?.success) {
      throw new Error(parseResult?.message || 'Failed to parse invoice')
    }

    // Get the parsed data
    const resultResponse = await fetch(parseResult.url, {
      headers: {
        'x-api-key': pdfcoApiKey,
      },
    })

    if (!resultResponse.ok) {
      throw new Error(`Failed to fetch parse results: ${await resultResponse.text()}`)
    }

    const parsedData = await resultResponse.json()
    console.log('Parsed data:', parsedData)

    if (!parsedData?.fields) {
      throw new Error('Invalid parsed data format')
    }

    // Transform the data into our desired format with safe fallbacks
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
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error parsing invoice:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})