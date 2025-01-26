import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldMappingSuggestions } from '../field-mapping/FieldMappingSuggestions';
import { useToast } from "@/hooks/use-toast";
import { ExportMenu } from './ExportMenu';

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
  const [isPreviewMinimized, setIsPreviewMinimized] = useState(false);
  const { toast } = useToast();

  const handleAcceptMappings = (mappings: Record<string, string>) => {
    console.log('Accepted mappings:', mappings);
    setShowMappingSuggestions(false);
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
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMinimized(!isPreviewMinimized)}
              className="gap-2"
            >
              {isPreviewMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
              {isPreviewMinimized ? 'Expand Preview' : 'Minimize Preview'}
            </Button>
            <ExportMenu 
              userPlan={userPlan}
              onExport={handleExport}
            />
          </div>

          {!isPreviewMinimized && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* PDF Preview */}
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

              {/* Extracted Data */}
              <Card className="p-4 bg-white">
                <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
                <div className="space-y-4">
                  {extractedData && Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="group">
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
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};