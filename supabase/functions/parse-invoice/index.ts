import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
                  url: fileUrl,
                  detail: "high"
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