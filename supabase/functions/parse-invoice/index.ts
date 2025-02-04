import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl } = await req.json();
    
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    console.log('Processing invoice from URL:', fileUrl);

    // Use PDF.co API to convert PDF to PNG
    const pdfcoApiKey = Deno.env.get('PDFCO_API_KEY');
    if (!pdfcoApiKey) {
      throw new Error('PDF.co API key not configured');
    }

    // First, convert PDF to PNG using PDF.co
    console.log('Converting PDF to PNG using PDF.co...');
    const pdfcoResponse = await fetch(`https://api.pdf.co/v1/pdf/convert/to/png`, {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        pages: "1",
        async: false
      })
    });

    if (!pdfcoResponse.ok) {
      const error = await pdfcoResponse.text();
      console.error('PDF.co API error:', error);
      throw new Error(`PDF.co API error: ${error}`);
    }

    const pdfcoData = await pdfcoResponse.json();
    if (!pdfcoData.url) {
      throw new Error('PDF.co conversion failed to return image URL');
    }

    console.log('Successfully converted PDF to PNG, sending to OpenAI...');

    // Now send the PNG to OpenAI
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this invoice and extract the following information in JSON format:
                - vendor_name
                - invoice_number
                - invoice_date
                - due_date
                - total_amount
                - currency
                - payment_terms
                - purchase_order_number
                - billing_address
                - shipping_address
                - notes
                - payment_method
                - discount_amount
                - additional_fees
                - tax_amount
                - subtotal

                Please return ONLY the JSON object with these fields, nothing else. Use null for missing values.
                Format dates as YYYY-MM-DD strings.
                Format all monetary values as numbers without currency symbols.`
              },
              {
                type: "image_url",
                image_url: {
                  url: pdfcoData.url
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0
      })
    });

    if (!openAiResponse.ok) {
      const error = await openAiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openAiData = await openAiResponse.json();
    
    if (!openAiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(openAiData.choices[0].message.content);
      console.log('Successfully parsed invoice data:', parsedData);
    } catch (e) {
      console.error('Error parsing OpenAI response as JSON:', e);
      throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`);
    }

    return new Response(
      JSON.stringify(parsedData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error processing invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process invoice',
        details: error.message
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});