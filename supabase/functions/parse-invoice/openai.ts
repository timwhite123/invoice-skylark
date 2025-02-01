import { corsHeaders } from './utils.ts'

const SYSTEM_PROMPT = `You are an expert invoice parser. Extract and return invoice details in this exact JSON format:
{
  "vendor_name": "string",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "total_amount": number,
  "currency": "string",
  "payment_terms": "string",
  "purchase_order_number": "string",
  "billing_address": "string",
  "shipping_address": "string",
  "notes": "string",
  "tax_amount": number,
  "subtotal": number,
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "total": number
    }
  ]
}`

export const parseInvoiceWithOpenAI = async (fileUrl: string, openAiApiKey: string) => {
  console.log('Starting invoice parsing process...');
  
  try {
    console.log('Calling OpenAI API...');
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the invoice information from this file and return it in the specified JSON format. Ensure all dates are in YYYY-MM-DD format and all numeric values are numbers, not strings."
              },
              {
                type: "image_url",
                image_url: {
                  url: fileUrl
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!openAiResponse.ok) {
      const error = await openAiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API returned ${openAiResponse.status}: ${error}`);
    }

    const openAiData = await openAiResponse.json();
    console.log('OpenAI raw response:', openAiData);

    if (!openAiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI: The API response did not contain the expected data structure');
    }

    try {
      return JSON.parse(openAiData.choices[0].message.content);
    } catch (e) {
      console.error('Error parsing OpenAI response as JSON:', e, 'Raw content:', openAiData.choices[0].message.content);
      throw new Error(`Failed to parse OpenAI response as JSON: ${e.message}`);
    }
  } catch (error) {
    console.error('Error in parseInvoiceWithOpenAI:', error);
    throw error;
  }
}