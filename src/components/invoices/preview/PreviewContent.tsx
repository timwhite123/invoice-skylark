import { ExtractedInformation } from '../ExtractedInformation';
import { DocumentPreview } from '../DocumentPreview';

interface PreviewContentProps {
  extractedData: Record<string, any>;
  userPlan: 'free' | 'pro' | 'enterprise';
  fileUrl: string;
  isLoading: boolean;
  onLoad: () => void;
  onExport: (format: string) => void;
}

export const PreviewContent = ({
  extractedData,
  userPlan,
  fileUrl,
  isLoading,
  onLoad,
  onExport,
}: PreviewContentProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ExtractedInformation
        extractedData={extractedData}
        userPlan={userPlan}
        onExport={onExport}
      />
      <DocumentPreview
        fileUrl={fileUrl}
        isLoading={isLoading}
        onLoad={onLoad}
      />
    </div>
  );
};