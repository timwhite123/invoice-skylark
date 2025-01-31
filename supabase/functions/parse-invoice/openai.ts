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

async function convertPdfToImage(pdfUrl: string): Promise<string> {
  // Using PDF.co API to convert PDF to PNG
  const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key not configured');
  }

  console.log('Converting PDF to image using PDF.co API...');
  
  const params = new URLSearchParams({
    url: pdfUrl,
    async: 'false',
    pages: '1',
    profiles: 'web'
  });

  const response = await fetch(
    `https://api.pdf.co/v1/pdf/convert/to/png?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('PDF.co API error:', error);
    throw new Error(`PDF.co API returned ${response.status}: ${error}`);
  }

  const data = await response.json();
  console.log('PDF.co conversion response:', data);

  if (!data.url) {
    throw new Error('PDF.co API did not return an image URL');
  }

  return data.url;
}

export const parseInvoiceWithOpenAI = async (pdfUrl: string, openAiApiKey: string) => {
  console.log('Starting invoice parsing process...');
  
  try {
    // Convert PDF to image first
    const imageUrl = await convertPdfToImage(pdfUrl);
    console.log('Successfully converted PDF to image:', imageUrl);

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
                text: "Extract the invoice information from this image and return it in the specified JSON format. Ensure all dates are in YYYY-MM-DD format and all numeric values are numbers, not strings."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
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