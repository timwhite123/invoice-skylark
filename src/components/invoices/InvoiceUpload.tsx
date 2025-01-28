import { FileUploadZone } from "./upload/FileUploadZone";
import { UploadProgress } from "./upload/UploadProgress";
import { InvoicePreview } from "./InvoicePreview";
import { useFileUpload } from "./upload/useFileUpload";
import { useState } from "react";

interface InvoiceUploadProps {
  userPlan: 'free' | 'pro' | 'enterprise';
}

export const InvoiceUpload = ({ userPlan }: InvoiceUploadProps) => {
  const {
    isUploading,
    uploadProgress,
    files,
    currentFileIndex,
    fileUrls,
    extractedData,
    handleCancel,
    handleDrop,
  } = useFileUpload(userPlan);

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const handleInvoiceSelect = (url: string, selected: boolean) => {
    setSelectedInvoices(prev => 
      selected 
        ? [...prev, url]
        : prev.filter(i => i !== url)
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <FileUploadZone
          userPlan={userPlan}
          isUploading={isUploading}
          onDrop={handleDrop}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <UploadProgress
              currentFileIndex={currentFileIndex}
              totalFiles={files.length}
              progress={uploadProgress}
            />
          </div>
        )}
      </div>

      {fileUrls.map((url, index) => (
        <InvoicePreview 
          key={url}
          fileUrl={url} 
          extractedData={extractedData[index]}
          onCancel={handleCancel}
          userPlan={userPlan}
          onSelect={(selected) => handleInvoiceSelect(url, selected)}
          isSelected={selectedInvoices.includes(url)}
        />
      ))}
    </div>
  );
};