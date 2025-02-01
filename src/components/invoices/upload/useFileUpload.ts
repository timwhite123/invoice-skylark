import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

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
    setCurrentFileIndex(0);
    setUploadProgress(0);
    setFileUrls([]);
    setExtractedData([]);
  };

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Starting file upload process with files:', acceptedFiles.map(f => ({ name: f.name, size: f.size })));
    
    const maxFiles = userPlan === 'free' ? 1 : 10;
    const sizeLimit = FILE_SIZE_LIMITS[userPlan];
    
    if (acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `${userPlan === 'free' ? 'Free plan allows only 1 file' : `Maximum ${maxFiles} files`} at a time.`,
        variant: "destructive",
      });
      return;
    }

    const oversizedFiles = acceptedFiles.filter(file => file.size > sizeLimit);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Maximum file size for ${userPlan} plan is ${sizeLimit / (1024 * 1024)}MB.`,
        variant: "destructive",
      });
      return;
    }

    setFiles(acceptedFiles);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newFileUrls: string[] = [];
      const newExtractedData: Record<string, any>[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setCurrentFileIndex(i);
        setUploadProgress((i / acceptedFiles.length) * 100);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        console.log('Processing file:', file.name);
        
        const fileName = `${crypto.randomUUID()}.pdf`;
        
        console.log('Uploading PDF to Supabase storage:', fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoice-files')
          .upload(fileName, file, {
            contentType: 'application/pdf'
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('invoice-files')
          .getPublicUrl(fileName);

        console.log('File uploaded successfully, public URL:', publicUrl);
        newFileUrls.push(publicUrl);

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
        newExtractedData.push(parseData);

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
            notes: parseData.notes,
            tax_amount: parseData.tax_amount,
            subtotal: parseData.subtotal,
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }
      }

      setFileUrls(newFileUrls);
      setExtractedData(newExtractedData);
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
      setFiles([]);
      setCurrentFileIndex(0);
      setUploadProgress(0);
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