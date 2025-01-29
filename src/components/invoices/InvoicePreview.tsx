import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { FieldMappingControls } from './preview/FieldMappingControls';
import { PreviewContent } from './preview/PreviewContent';

interface InvoicePreviewProps {
  fileUrl: string | null;
  extractedData?: Record<string, any>;
  onCancel: () => void;
  userPlan?: 'free' | 'pro' | 'enterprise';
  onSelect?: (selected: boolean) => void;
  isSelected?: boolean;
}

export const InvoicePreview = ({ 
  fileUrl, 
  extractedData, 
  onCancel,
  userPlan = 'free',
  onSelect,
  isSelected = false
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

  if (!fileUrl) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-6">
        <FieldMappingControls
          onSelect={onSelect}
          isSelected={isSelected}
        />

        <PreviewContent
          extractedData={extractedData || {}}
          userPlan={userPlan}
          fileUrl={fileUrl}
          isLoading={isLoading}
          onLoad={() => setIsLoading(false)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
};