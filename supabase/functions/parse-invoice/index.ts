import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.189/build/pdf.min.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { fileUrl } = await req.json();
    console.log('Processing request with fileUrl:', fileUrl);
    
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    // Configure PDF.js worker
    const pdfjsWorker = {
      async postMessage(data: any) {
        return { data: {} };
      },
      addEventListener() {},
      removeEventListener() {},
    };

    (pdfjs as any).GlobalWorkerOptions.workerSrc = '';
    (pdfjs as any).GlobalWorkerOptions.workerPort = pdfjsWorker;

    // Fetch the PDF file
    console.log('Fetching PDF file...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(fileUrl, {
        headers: {
          'Accept': 'application/pdf'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error('Failed to fetch PDF:', response.status, response.statusText);
        throw new Error(`Failed to fetch PDF file: ${response.statusText}`);
      }

      const pdfData = await response.arrayBuffer();
      
      // Load and process the PDF
      console.log('Loading PDF document...');
      const loadingTask = pdfjs.getDocument({
        data: pdfData,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.189/standard_fonts/'
      });
      
      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      
      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      // Process with OpenAI
      console.log('Sending to OpenAI...');
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Extract invoice details from the following text and return them in this exact JSON format:
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
                "subtotal": number
              }`
            },
            {
              role: "user",
              content: fullText
            }
          ]
        })
      });

      if (!openAiResponse.ok) {
        const error = await openAiResponse.text();
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const openAiData = await openAiResponse.json();
      console.log('OpenAI response received');
      
      if (!openAiData.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI');
      }

      const parsedData = JSON.parse(openAiData.choices[0].message.content);
      console.log('Successfully parsed invoice data');

      return new Response(
        JSON.stringify(parsedData),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );

    } finally {
      clearTimeout(timeout);
    }

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