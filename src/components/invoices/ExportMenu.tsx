import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportMenuProps {
  userPlan: "free" | "pro" | "enterprise";
  onExport: (format: string) => void;
  isMerged?: boolean;
}

export const ExportMenu = ({ userPlan, onExport, isMerged = false }: ExportMenuProps) => {
  const { toast } = useToast();

  const handleExport = (format: string) => {
    if (userPlan === "free" && format !== "text") {
      toast({
        title: "Feature not available",
        description: "Upgrade to Pro or Enterprise to access additional export formats.",
        variant: "destructive",
      });
      return;
    }
    onExport(format);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export {isMerged ? "Merged" : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport("text")}>
          Text
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("csv")}
          className={userPlan === "free" ? "opacity-50" : ""}
        >
          CSV {userPlan === "free" && "(Pro)"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("json")}
          className={userPlan === "free" ? "opacity-50" : ""}
        >
          JSON {userPlan === "free" && "(Pro)"}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("excel")}
          className={userPlan === "free" ? "opacity-50" : ""}
        >
          Excel {userPlan === "free" && "(Pro)"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};