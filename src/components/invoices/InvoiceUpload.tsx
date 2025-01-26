import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { InvoicePreview } from "./InvoicePreview";

interface InvoiceUploadProps {
  userPlan: string;
}

export const InvoiceUpload = ({ userPlan }: InvoiceUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
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
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const maxFiles = userPlan === 'free' ? 1 : 10;
    
    if (acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Free plan allows only ${maxFiles} file at a time. Upgrade to process multiple files.`,
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

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setCurrentFileIndex(i);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoice-files')
          .upload(`${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('invoice-files')
          .getPublicUrl(fileName);

        setFileUrls(prev => [...prev, publicUrl]);

        const { data: parseData, error: parseError } = await supabase.functions
          .invoke('parse-invoice', {
            body: { fileUrl: publicUrl },
          });

        if (parseError) throw parseError;

        setExtractedData(prev => [...prev, parseData]);

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

        if (dbError) throw dbError;
      }

      toast({
        title: "Upload complete",
        description: `Successfully processed ${files.length} invoice${files.length > 1 ? 's' : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-invoice'] });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your invoice(s)",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, queryClient, userPlan]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: userPlan === 'free' ? 1 : 10,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          flex flex-col items-center justify-center p-10 border-2 border-dashed
          rounded-lg cursor-pointer transition-colors bg-white
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isUploading ? (
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">
              Processing file {currentFileIndex + 1} of {files.length}...
            </p>
          </div>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? "Drop your invoice(s) here"
                : `Drag and drop your invoice PDF${userPlan !== 'free' ? 's' : ''}, or click to select`}
            </p>
            {userPlan === 'free' && (
              <p className="mt-1 text-xs text-gray-500">
                Free plan allows 1 file at a time. Upgrade to process multiple files.
              </p>
            )}
          </>
        )}
      </div>

      {fileUrls.map((url, index) => (
        <InvoicePreview 
          key={url}
          fileUrl={url} 
          extractedData={extractedData[index]}
          onCancel={handleCancel}
          userPlan={userPlan}
        />
      ))}
    </div>
  );
};