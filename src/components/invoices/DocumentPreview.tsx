import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DocumentPreviewProps {
  fileUrl: string;
  isLoading: boolean;
  onLoad: () => void;
}

export const DocumentPreview = ({ fileUrl, isLoading, onLoad }: DocumentPreviewProps) => {
  // Ensure the URL is properly formatted
  const sanitizedUrl = fileUrl.replace(/:\/$/, '');
  
  return (
    <Card className="p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">Document Preview</h3>
      <div className="relative aspect-[3/4] w-full bg-gray-50 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          src={`${sanitizedUrl}#toolbar=0`}
          className="w-full h-full"
          onLoad={onLoad}
        />
      </div>
    </Card>
  );
};