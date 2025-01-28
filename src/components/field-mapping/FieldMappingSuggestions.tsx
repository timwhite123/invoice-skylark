import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Info } from "lucide-react";
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
    Object.entries(extractedData).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      const valueStr = String(value).toLowerCase();

      // Enhanced type detection based on value content and patterns
      if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
        if (keyLower.includes('amount') || keyLower.includes('total') || keyLower.includes('price')) {
          initialMappings[key] = 'total_amount';
        } else if (keyLower.includes('tax')) {
          initialMappings[key] = 'tax_amount';
        } else if (keyLower.includes('discount')) {
          initialMappings[key] = 'discount_amount';
        } else if (keyLower.includes('subtotal')) {
          initialMappings[key] = 'subtotal';
        }
      } else if (
        value instanceof Date || 
        (typeof value === 'string' && !isNaN(Date.parse(value))) ||
        /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(valueStr)
      ) {
        if (keyLower.includes('due')) {
          initialMappings[key] = 'due_date';
        } else {
          initialMappings[key] = 'invoice_date';
        }
      } else if (typeof value === 'string') {
        if (keyLower.match(/vendor|company|supplier|business|from|seller/)) {
          initialMappings[key] = 'vendor_name';
        } else if (keyLower.match(/invoice.*num|ref|reference|document.*id|inv.*no/)) {
          initialMappings[key] = 'invoice_number';
        } else if (keyLower.match(/currency|cur|money/)) {
          initialMappings[key] = 'currency';
        } else if (keyLower.match(/payment.*method|pay.*via|pay.*using/)) {
          initialMappings[key] = 'payment_method';
        } else if (keyLower.match(/payment.*terms|terms|net/)) {
          initialMappings[key] = 'payment_terms';
        } else if (keyLower.match(/po|purchase.*order|order.*num/)) {
          initialMappings[key] = 'purchase_order_number';
        } else if (keyLower.match(/bill.*address|billing/)) {
          initialMappings[key] = 'billing_address';
        } else if (keyLower.match(/ship.*address|shipping|deliver/)) {
          initialMappings[key] = 'shipping_address';
        } else if (keyLower.match(/note|comment|remark|description/)) {
          initialMappings[key] = 'notes';
        }
      }
      
      if (!initialMappings[key]) {
        initialMappings[key] = 'unmapped';
      }
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
    { value: 'subtotal', label: 'Subtotal' },
    { value: 'tax_amount', label: 'Tax Amount' },
    { value: 'discount_amount', label: 'Discount Amount' },
    { value: 'additional_fees', label: 'Additional Fees' },
    { value: 'currency', label: 'Currency' },
    { value: 'payment_method', label: 'Payment Method' },
    { value: 'payment_terms', label: 'Payment Terms' },
    { value: 'purchase_order_number', label: 'Purchase Order Number' },
    { value: 'billing_address', label: 'Billing Address' },
    { value: 'shipping_address', label: 'Shipping Address' },
    { value: 'notes', label: 'Notes' },
    { value: 'custom', label: 'Custom Type' },
    { value: 'unmapped', label: 'Do Not Map' },
  ];

  const formatSampleValue = (value: any): string => {
    if (value === null || value === undefined) return 'No data extracted';
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
    if (typeof value === 'string' && value.trim() === '') {
      return 'No data extracted';
    }
    return String(value);
  };

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

      <div className="grid grid-cols-8 gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium">
        <div className="col-span-3">Extracted Value</div>
        <div className="col-span-4">Data Type</div>
        <div className="col-span-1">Action</div>
      </div>

      <div className="space-y-2">
        {Object.entries(extractedData).map(([field, value]) => (
          <div
            key={field}
            className={`grid grid-cols-8 gap-2 items-center p-2 rounded-lg border ${
              excludedFields.has(field) ? 'opacity-50 bg-gray-50' : ''
            }`}
          >
            <div className="col-span-3 text-sm text-gray-600 truncate" title={formatSampleValue(value)}>
              {formatSampleValue(value)}
            </div>
            <div className="col-span-4">
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

      <div className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Review and accept the field mappings to proceed with exporting your document
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleAccept}>
            Accept Mappings
          </Button>
        </div>
      </div>
    </Card>
  );
};