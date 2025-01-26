import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { invoiceIds } = await req.json()
    
    if (!invoiceIds || !Array.isArray(invoiceIds)) {
      return new Response(
        JSON.stringify({ error: 'Invalid invoice IDs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all invoices with their file URLs
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .in('id', invoiceIds)

    if (fetchError) {
      console.error('Error fetching invoices:', fetchError)
      throw fetchError
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create()
    
    // Download and merge each PDF
    for (const invoice of invoices) {
      if (invoice.original_file_url) {
        try {
          const response = await fetch(invoice.original_file_url)
          const pdfBytes = await response.arrayBuffer()
          const pdf = await PDFDocument.load(pdfBytes)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
        } catch (error) {
          console.error(`Error processing PDF for invoice ${invoice.id}:`, error)
        }
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save()
    
    // Upload the merged PDF to Supabase Storage
    const timestamp = new Date().toISOString()
    const fileName = `merged-invoices-${timestamp}.pdf`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('invoice-files')
      .upload(`merged/${fileName}`, mergedPdfBytes, {
        contentType: 'application/pdf',
      })

    if (uploadError) {
      console.error('Error uploading merged PDF:', uploadError)
      throw uploadError
    }

    // Get the public URL for the merged PDF
    const { data: { publicUrl } } = supabase
      .storage
      .from('invoice-files')
      .getPublicUrl(`merged/${fileName}`)

    const mergedData = {
      invoices,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      count: invoices.length,
      mergedFileUrl: publicUrl,
    }

    return new Response(
      JSON.stringify(mergedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error merging invoices:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to merge invoices', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})