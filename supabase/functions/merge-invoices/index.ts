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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least two invoice IDs are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Fetch all selected invoices with their items and contacts
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        invoice_contacts (*)
      `)
      .in('id', invoiceIds)
      .order('invoice_date', { ascending: true })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      throw invoicesError
    }

    if (!invoices || invoices.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No invoices found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Calculate totals across all invoices
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0)
    const totalSubtotal = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0)
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount_amount || 0), 0)
    const totalAdditionalFees = invoices.reduce((sum, inv) => sum + (inv.additional_fees || 0), 0)

    // Prepare merged data structure
    const mergedData = {
      invoices: invoices.map(invoice => ({
        vendor_name: invoice.vendor_name,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        tax_amount: invoice.tax_amount,
        subtotal: invoice.subtotal,
        discount_amount: invoice.discount_amount,
        additional_fees: invoice.additional_fees,
        payment_terms: invoice.payment_terms,
        purchase_order_number: invoice.purchase_order_number,
        billing_address: invoice.billing_address,
        shipping_address: invoice.shipping_address,
        payment_method: invoice.payment_method,
        notes: invoice.notes,
        items: invoice.invoice_items,
        contacts: invoice.invoice_contacts
      })),
      summary: {
        total_invoices: invoices.length,
        total_amount: totalAmount,
        total_tax: totalTax,
        total_subtotal: totalSubtotal,
        total_discount: totalDiscount,
        total_additional_fees: totalAdditionalFees,
        currency: invoices[0]?.currency || 'USD', // Use the currency from the first invoice as default
        date_range: {
          earliest: invoices[0]?.invoice_date,
          latest: invoices[invoices.length - 1]?.invoice_date
        }
      }
    }

    return new Response(
      JSON.stringify(mergedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error merging invoices:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred while merging invoices',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})