import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { PreviewContent } from './preview/PreviewContent';

interface InvoicePreviewProps {
  fileUrl: string | null;
  extractedData?: Record<string, any>;
  onCancel: () => void;
  userPlan?: 'free' | 'pro' | 'enterprise';
  isSelected?: boolean;
}

export const InvoicePreview = ({ 
  fileUrl, 
  extractedData, 
  onCancel,
  userPlan = 'free',
  isSelected = true
}: InvoicePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleExport = (format: string) => {
    console.log('Exporting in format:', format);
    toast({
      title: "Export started",
      description: `Exporting invoice in ${format} format`,
    });
  };

  // Ensure we have a valid URL before rendering
  if (!fileUrl) return null;

  // Remove any potential trailing colons from the URL
  const sanitizedFileUrl = fileUrl.replace(/:\/$/, '');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-6">
        <PreviewContent
          extractedData={extractedData || {}}
          userPlan={userPlan}
          fileUrl={sanitizedFileUrl}
          isLoading={isLoading}
          onLoad={() => setIsLoading(false)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
};