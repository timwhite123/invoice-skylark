import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InvoiceMerge = () => {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleToggleSelect = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleMerge = async () => {
    if (selectedInvoices.length < 2) {
      toast({
        title: "Select at least two invoices",
        description: "You need to select multiple invoices to merge them.",
        variant: "destructive",
      });
      return;
    }

    setIsMerging(true);

    try {
      const { data: mergedData, error } = await supabase.functions
        .invoke('merge-invoices', {
          body: { invoiceIds: selectedInvoices },
        });

      if (error) throw error;

      // Save the merge history
      const { error: historyError } = await supabase
        .from('export_history')
        .insert({
          invoice_ids: selectedInvoices,
          export_type: 'merge',
          version: 1,
        });

      if (historyError) throw historyError;

      toast({
        title: "Invoices merged successfully",
        description: `Combined ${mergedData.count} invoices with a total amount of ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(mergedData.totalAmount)}`,
      });

      // Reset selection after successful merge
      setSelectedInvoices([]);

    } catch (error: any) {
      console.error('Merge error:', error);
      toast({
        title: "Failed to merge invoices",
        description: error.message || "There was an error merging the invoices",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center border-2 border-dashed rounded-lg bg-background/50">
        <Upload className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No invoices found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload some invoices first before using the merge feature.
          </p>
        </div>
        <Button onClick={() => navigate("/")}>
          Upload Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Select Invoices to Merge</h2>
        <Button 
          onClick={handleMerge}
          disabled={selectedInvoices.length < 2 || isMerging}
        >
          {isMerging ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Merging...
            </>
          ) : (
            <>Merge Selected ({selectedInvoices.length})</>
          )}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={() => handleToggleSelect(invoice.id)}
                    disabled={isMerging}
                  />
                </TableCell>
                <TableCell>{invoice.vendor_name}</TableCell>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>
                  {invoice.invoice_date 
                    ? format(new Date(invoice.invoice_date), 'MMM d, yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  {invoice.total_amount
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currency || 'USD'
                      }).format(invoice.total_amount)
                    : '-'}
                </TableCell>
                <TableCell>
                  <span className="capitalize">{invoice.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};