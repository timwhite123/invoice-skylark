import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { InvoicePreview } from "./InvoicePreview";

export const InvoiceUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCancel = () => {
    setFileUrl(null);
    setExtractedData(null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
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

      setFileUrl(publicUrl);

      const { data: parseData, error: parseError } = await supabase.functions
        .invoke('parse-invoice', {
          body: { fileUrl: publicUrl },
        });

      if (parseError) throw parseError;

      console.log('Parsed data:', parseData);
      setExtractedData(parseData);

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

      toast({
        title: "Invoice uploaded",
        description: "Your invoice has been processed successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-invoice'] });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your invoice",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
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
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        ) : (
          <FileUp className="h-10 w-10 text-gray-400" />
        )}
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Drop your invoice here"
            : "Drag and drop your invoice PDF, or click to select"}
        </p>
      </div>

      {fileUrl && extractedData && (
        <InvoicePreview 
          fileUrl={fileUrl} 
          extractedData={extractedData}
          onCancel={handleCancel}
          userPlan="free"
        />
      )}
    </div>
  );
};