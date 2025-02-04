import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.189/build/pdf.min.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create a minimal worker implementation
const pdfjsWorker = {
  async postMessage(data: any) {
    return { data: {} };
  },
  addEventListener() {},
  removeEventListener() {},
};

serve(async (req) => {
  console.log('Received request:', req.method, 'from origin:', req.headers.get('origin'));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { fileUrl } = await req.json();
    
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    console.log('Processing invoice from URL:', fileUrl);

    // Configure PDF.js worker
    (pdfjs as any).GlobalWorkerOptions.workerSrc = '';
    (pdfjs as any).GlobalWorkerOptions.workerPort = pdfjsWorker;

    // Fetch the PDF file with error handling and timeout
    console.log('Fetching PDF file...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
      if (!pdfData || pdfData.byteLength === 0) {
        throw new Error('Retrieved PDF data is empty');
      }

      // Load the PDF document
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
      console.log('Extracting text from PDF...');
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log('Extracted text length:', fullText.length);

      // Send to OpenAI for analysis
      console.log('Sending to OpenAI for analysis...');
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
              content: `You are an expert invoice parser. Extract invoice details from the following text and return them in this exact JSON format:
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
              }
              
              Important rules:
              - Format all dates as YYYY-MM-DD strings
              - Format all monetary values as numbers without currency symbols
              - Use null for missing values
              - Be precise and accurate in your extraction
              - Only return the JSON object, nothing else`
            },
            {
              role: "user",
              content: fullText
            }
          ],
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
        console.log('Successfully parsed invoice data');
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