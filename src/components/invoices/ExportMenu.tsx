import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileDown, Lock, Export } from "lucide-react";
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
        <Button size="lg" className="gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-6">
          <Export className="h-5 w-5" />
          Export {isMerged ? "Merged" : "Document"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport("text")} className="cursor-pointer">
          <FileDown className="h-4 w-4 mr-2" /> Text
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("csv")}
          className={`cursor-pointer ${userPlan === "free" ? "opacity-50" : ""}`}
        >
          <FileDown className="h-4 w-4 mr-2" /> CSV {userPlan === "free" && <Lock className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("json")}
          className={`cursor-pointer ${userPlan === "free" ? "opacity-50" : ""}`}
        >
          <FileDown className="h-4 w-4 mr-2" /> JSON {userPlan === "free" && <Lock className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("excel")}
          className={`cursor-pointer ${userPlan === "free" ? "opacity-50" : ""}`}
        >
          <FileDown className="h-4 w-4 mr-2" /> Excel {userPlan === "free" && <Lock className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};