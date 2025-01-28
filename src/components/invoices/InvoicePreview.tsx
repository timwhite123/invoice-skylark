import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FieldMappingSuggestions } from '../field-mapping/FieldMappingSuggestions';
import { useToast } from "@/hooks/use-toast";
import { DocumentPreview } from './DocumentPreview';
import { ExtractedInformation } from './ExtractedInformation';

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
          <div className="flex items-center justify-between">
            {isMapperMinimized ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMapperMinimized(false);
                  setShowMappingSuggestions(true);
                }}
                className="flex items-center gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                {mappingsAccepted ? "Update Field Mappings" : "Show Field Mappings"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMapperMinimized(true)}
                className="flex items-center gap-2"
              >
                <ChevronUp className="h-4 w-4" />
                Hide Field Mappings
              </Button>
            )}
            
            {onSelect && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invoice-select"
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(checked as boolean)}
                />
                <label
                  htmlFor="invoice-select"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Select for export
                </label>
              </div>
            )}
          </div>

          {!isMapperMinimized && (
            <FieldMappingSuggestions
              extractedData={extractedData || {}}
              onAccept={handleAcceptMappings}
              onCancel={onCancel}
            />
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <ExtractedInformation
              extractedData={extractedData || {}}
              userPlan={userPlan}
              onExport={handleExport}
            />
            <DocumentPreview
              fileUrl={fileUrl}
              isLoading={isLoading}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};