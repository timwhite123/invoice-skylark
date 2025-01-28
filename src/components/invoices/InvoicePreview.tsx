import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { FieldMappingSuggestions } from '../field-mapping/FieldMappingSuggestions';
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
  const [showMappingSuggestions, setShowMappingSuggestions] = useState(true);
  const [isMapperMinimized, setIsMapperMinimized] = useState(false);
  const [mappingsAccepted, setMappingsAccepted] = useState(false);
  const { toast } = useToast();

  const handleAcceptMappings = (mappings: Record<string, string>) => {
    console.log('Accepted mappings:', mappings);
    setShowMappingSuggestions(false);
    setIsMapperMinimized(true);
    setMappingsAccepted(true);
    toast({
      title: "Mappings saved",
      description: "Field mappings have been saved successfully",
    });
  };

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
      {showMappingSuggestions ? (
        <FieldMappingSuggestions
          extractedData={extractedData || {}}
          onAccept={handleAcceptMappings}
          onCancel={onCancel}
        />
      ) : (
        <div className="space-y-6">
          <FieldMappingControls
            isMapperMinimized={isMapperMinimized}
            mappingsAccepted={mappingsAccepted}
            onShowMapper={() => {
              setIsMapperMinimized(false);
              setShowMappingSuggestions(true);
            }}
            onHideMapper={() => setIsMapperMinimized(true)}
            onSelect={onSelect}
            isSelected={isSelected}
          />

          {!isMapperMinimized && (
            <FieldMappingSuggestions
              extractedData={extractedData || {}}
              onAccept={handleAcceptMappings}
              onCancel={onCancel}
            />
          )}

          <PreviewContent
            extractedData={extractedData || {}}
            userPlan={userPlan}
            fileUrl={fileUrl}
            isLoading={isLoading}
            onLoad={() => setIsLoading(false)}
            onExport={handleExport}
          />
        </div>
      )}
    </div>
  );
};