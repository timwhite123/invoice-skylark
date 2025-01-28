import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface FieldMappingControlsProps {
  isMapperMinimized: boolean;
  mappingsAccepted: boolean;
  onShowMapper: () => void;
  onHideMapper: () => void;
  onSelect?: (selected: boolean) => void;
  isSelected?: boolean;
}

export const FieldMappingControls = ({
  isMapperMinimized,
  mappingsAccepted,
  onShowMapper,
  onHideMapper,
  onSelect,
  isSelected = false,
}: FieldMappingControlsProps) => {
  return (
    <div className="flex items-center justify-between">
      {isMapperMinimized ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowMapper}
          className="flex items-center gap-2"
        >
          <ChevronDown className="h-4 w-4" />
          {mappingsAccepted ? "Update Field Mappings" : "Show Field Mappings"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onHideMapper}
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
  );
};