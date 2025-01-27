import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldMappingSuggestions } from '../field-mapping/FieldMappingSuggestions';
import { useToast } from "@/hooks/use-toast";
import { ExportMenu } from './ExportMenu';
import { ScrollArea } from "@/components/ui/scroll-area";

interface InvoicePreviewProps {
  fileUrl: string | null;
  extractedData?: {
    vendor_name?: string;
    invoice_number?: string;
    invoice_date?: string;
    due_date?: string;
    total_amount?: number;
    currency?: string;
    tax_amount?: number;
    subtotal?: number;
  };
  onCancel: () => void;
  userPlan?: 'free' | 'pro' | 'enterprise';
}

export const InvoicePreview = ({ 
  fileUrl, 
  extractedData, 
  onCancel,
  userPlan = 'free' 
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

  const handleCancel = () => {
    onCancel();
  };

  if (!fileUrl) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {showMappingSuggestions ? (
        <FieldMappingSuggestions
          extractedData={extractedData || {}}
          onAccept={handleAcceptMappings}
          onCancel={handleCancel}
        />
      ) : (
        <div className="space-y-6">
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
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMapperMinimized(true)}
                className="flex items-center gap-2"
              >
                <ChevronUp className="h-4 w-4" />
                Hide Field Mappings
              </Button>
              <FieldMappingSuggestions
                extractedData={extractedData || {}}
                onAccept={handleAcceptMappings}
                onCancel={handleCancel}
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Extracted Data - Now on the left */}
            <Card className="p-4 bg-white">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
                <ScrollArea className="flex-grow h-[400px] pr-4">
                  <div className="space-y-3">
                    {extractedData && Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="group border-b border-gray-100 pb-2">
                        <div className="text-sm text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="font-medium">
                          {key.includes('amount') || key.includes('total')
                            ? `${extractedData.currency || '$'}${Number(value).toFixed(2)}`
                            : value || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Export Section */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-end">
                    <ExportMenu 
                      userPlan={userPlan}
                      onExport={handleExport}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* PDF Preview - Now on the right */}
            <Card className="p-4 bg-white">
              <h3 className="text-lg font-semibold mb-4">Document Preview</h3>
              <div className="relative aspect-[3/4] w-full bg-gray-50 rounded-lg overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  className="w-full h-full"
                  onLoad={() => setIsLoading(false)}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};