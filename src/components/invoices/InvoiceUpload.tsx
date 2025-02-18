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

  // Get only the most recent file
  const latestFileUrl = fileUrls && fileUrls.length > 0 ? fileUrls[fileUrls.length - 1] : null;
  const latestExtractedData = extractedData && extractedData.length > 0 ? extractedData[extractedData.length - 1] : undefined;

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

      {latestFileUrl && (
        <InvoicePreview 
          key={latestFileUrl}
          fileUrl={latestFileUrl} 
          extractedData={latestExtractedData}
          onCancel={handleCancel}
          userPlan={userPlan}
          isSelected={true}
        />
      )}
    </div>
  );
};