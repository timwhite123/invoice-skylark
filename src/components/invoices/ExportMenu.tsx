import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileDown, Lock, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExportMenuProps {
  userPlan: "free" | "pro" | "enterprise";
  onExport: (format: string) => void;
  isMerged?: boolean;
  selectedInvoices?: string[];
}

export const ExportMenu = ({ userPlan, onExport, isMerged = false, selectedInvoices = [] }: ExportMenuProps) => {
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    if (userPlan === "free" && format !== "text") {
      toast({
        title: "Feature not available",
        description: "Upgrade to Pro or Enterprise to access additional export formats.",
        variant: "destructive",
      });
      return;
    }

    if (selectedInvoices.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch the selected invoices data
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .in('id', selectedInvoices);

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        toast({
          title: "No data to export",
          description: "The selected invoices could not be found.",
          variant: "destructive",
        });
        return;
      }

      // Create text content
      let textContent = '';
      invoices.forEach((invoice, index) => {
        textContent += `Invoice #${invoice.invoice_number || 'N/A'}\n`;
        textContent += `Vendor: ${invoice.vendor_name || 'N/A'}\n`;
        textContent += `Date: ${invoice.invoice_date || 'N/A'}\n`;
        textContent += `Due Date: ${invoice.due_date || 'N/A'}\n`;
        textContent += `Total Amount: ${invoice.currency || '$'}${invoice.total_amount || '0.00'}\n`;
        
        if (invoice.invoice_items && invoice.invoice_items.length > 0) {
          textContent += '\nItems:\n';
          invoice.invoice_items.forEach((item: any) => {
            textContent += `- ${item.description || 'N/A'}: ${invoice.currency || '$'}${item.total_price || '0.00'}\n`;
          });
        }
        
        if (index < invoices.length - 1) {
          textContent += '\n-------------------\n\n';
        }
      });

      // Create and download the file
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log the export in export_history
      const { error: historyError } = await supabase
        .from('export_history')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          invoice_ids: selectedInvoices,
          export_type: 'text',
          export_format: format,
          file_name: a.download,
        });

      if (historyError) throw historyError;

      toast({
        title: "Export successful",
        description: "Your invoices have been exported successfully.",
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold px-6">
          <FileUp className="h-5 w-5" />
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