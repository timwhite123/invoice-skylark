import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { PDFDocument } from 'pdf-lib';
import imageCompression from 'browser-image-compression';

const FILE_SIZE_LIMITS = {
  free: 25 * 1024 * 1024, // 25MB
  pro: 100 * 1024 * 1024, // 100MB
  enterprise: 500 * 1024 * 1024, // 500MB
};

export const useFileUpload = (userPlan: 'free' | 'pro' | 'enterprise') => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<Record<string, any>[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCancel = () => {
    setFiles([]);
    setFileUrls([]);
    setExtractedData([]);
    setCurrentFileIndex(0);
    setUploadProgress(0);
  };

  const convertPdfToImage = async (file: File): Promise<File> => {
    try {
      console.log('Converting PDF to image:', file.name);
      
      // Create a URL for the PDF file
      const pdfUrl = URL.createObjectURL(file);
      
      // Create an iframe to load the PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Wait for the PDF to load in the iframe
      await new Promise((resolve) => {
        iframe.onload = resolve;
        iframe.src = pdfUrl;
      });
      
      // Create a canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      
      // Set canvas dimensions based on the iframe content
      const scale = 2; // Increase for better quality
      canvas.width = iframe.contentWindow!.document.body.scrollWidth * scale;
      canvas.height = iframe.contentWindow!.document.body.scrollHeight * scale;
      
      // Draw the PDF content to canvas
      context.scale(scale, scale);
      context.drawWindow(
        iframe.contentWindow!,
        0,
        0,
        iframe.contentWindow!.document.body.scrollWidth,
        iframe.contentWindow!.document.body.scrollHeight,
        'rgb(255,255,255)'
      );
      
      // Clean up
      URL.revokeObjectURL(pdfUrl);
      document.body.removeChild(iframe);
      
      // Get blob from canvas
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      
      // Compress the image
      const compressedFile = await imageCompression(new File([blob], 'temp.png', { type: 'image/png' }), {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
      });
      
      // Create final File object
      const imageFile = new File(
        [compressedFile], 
        file.name.replace('.pdf', '.png'),
        { type: 'image/png' }
      );
      
      console.log('PDF converted to image successfully');
      return imageFile;
    } catch (error) {
      console.error('Error converting PDF to image:', error);
      throw new Error('Failed to convert PDF to image');
    }
  };

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Starting file upload process with files:', acceptedFiles.map(f => ({ name: f.name, size: f.size })));
    
    const maxFiles = userPlan === 'free' ? 1 : 10;
    const sizeLimit = FILE_SIZE_LIMITS[userPlan];
    
    if (acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `${userPlan === 'free' ? 'Free plan allows only 1 file' : `Maximum ${maxFiles} files`} at a time. Upgrade to process more files.`,
        variant: "destructive",
      });
      return;
    }

    const oversizedFiles = acceptedFiles.filter(file => file.size > sizeLimit);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Maximum file size for ${userPlan} plan is ${sizeLimit / (1024 * 1024)}MB. Please upgrade your plan for larger files.`,
        variant: "destructive",
      });
      return;
    }

    const invalidFiles = acceptedFiles.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only",
        variant: "destructive",
      });
      return;
    }

    setFiles(acceptedFiles);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setCurrentFileIndex(i);
        setUploadProgress((i / acceptedFiles.length) * 100);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        console.log('Processing file:', file.name);
        
        // Convert PDF to image
        const imageFile = await convertPdfToImage(file);
        
        const fileName = `${crypto.randomUUID()}.png`;
        
        console.log('Uploading converted image to Supabase storage:', fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoice-files')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('invoice-files')
          .getPublicUrl(fileName);

        console.log('File uploaded successfully, public URL:', publicUrl);
        setFileUrls(prev => [...prev, publicUrl]);

        console.log('Invoking parse-invoice function with URL:', publicUrl);
        const { data: parseData, error: parseError } = await supabase.functions
          .invoke('parse-invoice', {
            body: { fileUrl: publicUrl },
          });

        if (parseError) {
          console.error('Parse invoice error:', parseError);
          throw parseError;
        }

        console.log('Received parsed invoice data:', parseData);
        setExtractedData(prev => [...prev, parseData]);

        console.log('Saving invoice to database...');
        const { error: dbError } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            vendor_name: parseData.vendor_name,
            invoice_number: parseData.invoice_number,
            invoice_date: parseData.invoice_date,
            due_date: parseData.due_date,
            total_amount: parseData.total_amount,
            currency: parseData.currency,
            original_file_url: publicUrl,
            status: 'pending',
            payment_terms: parseData.payment_terms,
            purchase_order_number: parseData.purchase_order_number,
            billing_address: parseData.billing_address,
            shipping_address: parseData.shipping_address,
            payment_method: parseData.payment_method,
            discount_amount: parseData.discount_amount,
            additional_fees: parseData.additional_fees,
            tax_amount: parseData.tax_amount,
            subtotal: parseData.subtotal,
            notes: parseData.notes,
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }
      }

      setUploadProgress(100);
      toast({
        title: "Upload complete",
        description: `Successfully processed ${files.length} invoice${files.length > 1 ? 's' : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-invoice'] });

    } catch (error: any) {
      console.error('Upload process error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your invoice(s)",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, queryClient, userPlan]);

  return {
    isUploading,
    uploadProgress,
    files,
    currentFileIndex,
    fileUrls,
    extractedData,
    handleCancel,
    handleDrop,
  };
};