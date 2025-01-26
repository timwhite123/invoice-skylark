import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Type, Info, AlignLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const initialMappings: Record<string, string> = {};
    Object.keys(extractedData).forEach(key => {
      if (key.includes('vendor')) initialMappings[key] = 'vendor_name';
      else if (key.includes('amount') || key.includes('total')) initialMappings[key] = 'total_amount';
      else if (key.includes('date')) initialMappings[key] = 'invoice_date';
      else if (key.includes('number')) initialMappings[key] = 'invoice_number';
      else initialMappings[key] = 'unmapped';
    });
    return initialMappings;
  });

  const [excludedFields, setExcludedFields] = useState<Set<string>>(new Set());
  const [customType, setCustomType] = useState("");
  const [selectedFieldForCustomType, setSelectedFieldForCustomType] = useState<string | null>(null);

  const fieldTypes = [
    { value: 'vendor_name', label: 'Vendor Name' },
    { value: 'invoice_number', label: 'Invoice Number' },
    { value: 'invoice_date', label: 'Invoice Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'currency', label: 'Currency' },
    { value: 'custom', label: 'Custom Type' },
    { value: 'unmapped', label: 'Do Not Map' },
  ];

  const handleFieldTypeChange = (field: string, type: string) => {
    if (type === 'custom') {
      setSelectedFieldForCustomType(field);
    } else {
      setMappings(prev => ({ ...prev, [field]: type }));
      setSelectedFieldForCustomType(null);
    }
  };

  const handleCustomTypeSubmit = (field: string) => {
    if (customType.trim()) {
      setMappings(prev => ({ ...prev, [field]: customType.trim() }));
      setCustomType("");
      setSelectedFieldForCustomType(null);
    }
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
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">Field Mapping Suggestions</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Map extracted fields to your desired data types or create custom ones</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium">
        <div className="col-span-3 flex items-center gap-2">
          <AlignLeft className="h-4 w-4" />
          Field Name
        </div>
        <div className="col-span-3">Sample Value</div>
        <div className="col-span-5">Data Type</div>
        <div className="col-span-1">Action</div>
      </div>

      <div className="space-y-2">
        {Object.entries(extractedData).map(([field, value]) => (
          <div
            key={field}
            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${
              excludedFields.has(field) ? 'opacity-50 bg-gray-50' : ''
            }`}
          >
            <div className="col-span-3 font-medium truncate" title={field}>
              {field}
            </div>
            <div className="col-span-3 text-sm text-gray-500 truncate" title={String(value)}>
              {String(value)}
            </div>
            <div className="col-span-5">
              {selectedFieldForCustomType === field ? (
                <div className="flex gap-2">
                  <Input
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Enter custom type..."
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCustomTypeSubmit(field)}
                    disabled={!customType.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={mappings[field]}
                  onValueChange={(value) => handleFieldTypeChange(field, value)}
                  disabled={excludedFields.has(field)}
                >
                  <SelectTrigger className="h-8">
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
              )}
            </div>
            <div className="col-span-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFieldExclusion(field)}
                    >
                      {excludedFields.has(field) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{excludedFields.has(field) ? 'Include field' : 'Exclude field'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 pt-4">
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