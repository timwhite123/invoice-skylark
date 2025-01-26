import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Edit2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FieldMappingSuggestionsProps {
  extractedData: Record<string, any>;
  onAccept: (mappings: Record<string, string>) => void;
  onCancel: () => void;
}

export const FieldMappingSuggestions = ({
  extractedData,
  onAccept,
  onCancel,
}: FieldMappingSuggestionsProps) => {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    // Initial suggested mappings
    const initialMappings: Record<string, string> = {};
    Object.keys(extractedData).forEach(key => {
      // Suggest mappings based on field names
      if (key.includes('vendor')) initialMappings[key] = 'vendor_name';
      else if (key.includes('amount') || key.includes('total')) initialMappings[key] = 'total_amount';
      else if (key.includes('date')) initialMappings[key] = 'invoice_date';
      else if (key.includes('number')) initialMappings[key] = 'invoice_number';
      else initialMappings[key] = 'unmapped';
    });
    return initialMappings;
  });

  const [excludedFields, setExcludedFields] = useState<Set<string>>(new Set());

  const fieldTypes = [
    { value: 'vendor_name', label: 'Vendor Name' },
    { value: 'invoice_number', label: 'Invoice Number' },
    { value: 'invoice_date', label: 'Invoice Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'currency', label: 'Currency' },
    { value: 'unmapped', label: 'Do Not Map' },
  ];

  const handleFieldTypeChange = (field: string, type: string) => {
    setMappings(prev => ({ ...prev, [field]: type }));
  };

  const toggleFieldExclusion = (field: string) => {
    setExcludedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const handleAccept = () => {
    const finalMappings: Record<string, string> = {};
    Object.entries(mappings).forEach(([field, type]) => {
      if (!excludedFields.has(field) && type !== 'unmapped') {
        finalMappings[field] = type;
      }
    });
    onAccept(finalMappings);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="text-lg font-semibold">Field Mapping Suggestions</div>
      <div className="space-y-4">
        {Object.entries(extractedData).map(([field, value]) => (
          <div
            key={field}
            className={`flex items-center gap-4 p-4 border rounded-lg ${
              excludedFields.has(field) ? 'opacity-50 bg-gray-50' : ''
            }`}
          >
            <div className="flex-1">
              <div className="font-medium">{field}</div>
              <div className="text-sm text-gray-500">{String(value)}</div>
            </div>
            
            <Select
              value={mappings[field]}
              onValueChange={(value) => handleFieldTypeChange(field, value)}
              disabled={excludedFields.has(field)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFieldExclusion(field)}
            >
              {excludedFields.has(field) ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleAccept}>
          Accept Mappings
        </Button>
      </div>
    </Card>
  );
};