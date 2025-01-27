import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  currentFileIndex: number;
  totalFiles: number;
  progress: number;
}

export const UploadProgress = ({ currentFileIndex, totalFiles, progress }: UploadProgressProps) => {
  return (
    <div className="text-center space-y-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
      <div className="w-full max-w-xs mx-auto">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Processing file {currentFileIndex + 1} of {totalFiles}...
      </p>
    </div>
  );
};