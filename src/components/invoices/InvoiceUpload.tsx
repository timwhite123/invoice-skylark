import { FileUploadZone } from "./upload/FileUploadZone";
import { UploadProgress } from "./upload/UploadProgress";
import { InvoicePreview } from "./InvoicePreview";
import { useFileUpload } from "./upload/useFileUpload";

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
          isSelected={true} // Always selected by default
        />
      ))}
    </div>
  );
};