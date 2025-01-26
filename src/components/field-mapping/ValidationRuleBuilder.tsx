import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Save, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ValidationRuleBuilderProps {
  validationType: string | null;
  validationRegex: string | null;
  validationMessage: string | null;
  onSave: (data: {
    validationType: string;
    validationRegex: string | null;
    validationMessage: string | null;
  }) => void;
}

export const ValidationRuleBuilder = ({
  validationType,
  validationRegex,
  validationMessage,
  onSave,
}: ValidationRuleBuilderProps) => {
  const [type, setType] = useState(validationType || "");
  const [regex, setRegex] = useState(validationRegex || "");
  const [message, setMessage] = useState(validationMessage || "");

  const validationTypes = [
    { value: "none", label: "No Validation" },
    { value: "regex", label: "Regular Expression" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone Number" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "currency", label: "Currency" },
  ];

  const handleSave = () => {
    onSave({
      validationType: type,
      validationRegex: type === "regex" ? regex : null,
      validationMessage: message || null,
    });
  };

  const getDefaultRegex = (type: string) => {
    switch (type) {
      case "email":
        return "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$";
      case "phone":
        return "^\\+?[1-9]\\d{1,14}$";
      case "date":
        return "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$";
      case "number":
        return "^-?\\d*\\.?\\d+$";
      case "currency":
        return "^\\$?\\d+(\\.\\d{2})?$";
      default:
        return "";
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType !== "regex") {
      setRegex(getDefaultRegex(newType));
    } else {
      setRegex("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Validation Type</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select validation type" />
          </SelectTrigger>
          <SelectContent>
            {validationTypes.map((vType) => (
              <SelectItem key={vType.value} value={vType.value}>
                {vType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "regex" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Regular Expression</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter a valid regular expression pattern</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            value={regex}
            onChange={(e) => setRegex(e.target.value)}
            placeholder="Enter regex pattern..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Error Message</Label>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter custom error message..."
        />
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Save Validation Rules
      </Button>
    </div>
  );
};