import { Checkbox } from "@/components/ui/checkbox";

interface FieldMappingControlsProps {
  onSelect?: (selected: boolean) => void;
  isSelected?: boolean;
}

export const FieldMappingControls = ({
  onSelect,
  isSelected = false,
}: FieldMappingControlsProps) => {
  return (
    <div className="flex items-center justify-end">
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