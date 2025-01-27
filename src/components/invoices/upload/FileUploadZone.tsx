import { useDropzone } from "react-dropzone";
import { FileUp } from "lucide-react";

interface FileUploadZoneProps {
  userPlan: 'free' | 'pro' | 'enterprise';
  isUploading: boolean;
  onDrop: (files: File[]) => void;
}

export const FileUploadZone = ({ userPlan, isUploading, onDrop }: FileUploadZoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: userPlan === 'free' ? 1 : 10,
    disabled: isUploading,
  });

  return (
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
      <FileUp className="h-10 w-10 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? "Drop your invoice(s) here"
          : `Drag and drop your invoice PDF${userPlan !== 'free' ? 's' : ''}, or click to select`}
      </p>
      <div className="mt-2 text-xs text-gray-500 space-y-1">
        <p>
          {userPlan === 'free' ? 'Free plan allows 1 file up to 25MB' : 
           userPlan === 'pro' ? 'Pro plan allows up to 10 files (100MB each)' :
           'Enterprise plan allows unlimited files up to 500MB each'}
        </p>
        {userPlan === 'free' && (
          <p className="text-primary">
            Upgrade to process multiple files and larger sizes
          </p>
        )}
      </div>
    </div>
  );
};