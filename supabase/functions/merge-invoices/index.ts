import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    // Fetch all invoices
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .in('id', invoiceIds)

    if (fetchError) {
      console.error('Error fetching invoices:', fetchError)
      throw fetchError
    }

    // For now, we'll just return the combined data
    // In Phase 3, we'll implement actual PDF merging
    const mergedData = {
      invoices,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      count: invoices.length,
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