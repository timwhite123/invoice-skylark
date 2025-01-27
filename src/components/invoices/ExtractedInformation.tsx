import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportMenu } from './ExportMenu';

interface ExtractedInformationProps {
  extractedData: Record<string, any>;
  userPlan?: 'free' | 'pro' | 'enterprise';
  onExport: (format: string) => void;
}

export const ExtractedInformation = ({ 
  extractedData, 
  userPlan = 'free',
  onExport 
}: ExtractedInformationProps) => {
  return (
    <Card className="p-4 bg-white">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
        <ScrollArea className="flex-grow h-[400px] pr-4">
          <div className="space-y-3">
            {Object.entries(extractedData).map(([key, value]) => (
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
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-end">
            <ExportMenu 
              userPlan={userPlan}
              onExport={onExport}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};