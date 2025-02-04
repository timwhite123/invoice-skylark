import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as pdfjs from 'npm:pdfjs-dist@4.0.189';
import { parseInvoiceTemplate } from './template.ts';
import { corsHeaders } from './utils.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { fileUrl } = await req.json();
    console.log('Processing request with fileUrl:', fileUrl);
    
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    // Validate URL format
    try {
      new URL(fileUrl);
    } catch (e) {
      throw new Error('Invalid file URL format');
    }

    // Configure PDF.js worker
    const pdfjsWorker = {
      async port(data: any) {
        return {
          data
        };
      }
    };

    (pdfjs as any).GlobalWorkerOptions.workerSrc = '';
    (pdfjs as any).GlobalWorkerOptions.workerPort = pdfjsWorker;

    // Fetch the PDF file with proper error handling
    console.log('Fetching PDF file...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error('Invalid content type: Expected PDF');
      }

      const pdfData = await response.arrayBuffer();
      if (!pdfData || pdfData.byteLength === 0) {
        throw new Error('Retrieved PDF data is empty');
      }
      
      // Load and process the PDF
      console.log('Loading PDF document...');
      const loadingTask = pdfjs.getDocument({
        data: pdfData,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      
      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      // Process with OpenAI
      console.log('Sending to OpenAI...');
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
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
          ],
          temperature: 0.3
        })
      });

      if (!openAiResponse.ok) {
        const errorText = await openAiResponse.text();
        throw new Error(`OpenAI API error: ${openAiResponse.status} - ${errorText}`);
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
        error: error.message || 'An error occurred while processing the invoice'
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});