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
import { Card } from "@/components/ui/card";

interface MergedInvoiceSummary {
  total_invoices: number;
  total_amount: number;
  total_tax: number;
  total_subtotal: number;
  total_discount: number;
  total_additional_fees: number;
  currency: string;
  date_range: {
    earliest: string;
    latest: string;
  };
}

interface MergedInvoiceData {
  invoices: Array<{
    vendor_name: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    currency: string;
    tax_amount: number;
    subtotal: number;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
  summary: MergedInvoiceSummary;
}

export const InvoiceMerge = () => {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedData, setMergedData] = useState<MergedInvoiceData | null>(null);
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
    setMergedData(null);

    try {
      const { data: mergedData, error } = await supabase.functions
        .invoke('merge-invoices', {
          body: { invoiceIds: selectedInvoices },
        });

      if (error) throw error;

      setMergedData(mergedData);

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
        description: `Combined ${mergedData.summary.total_invoices} invoices with a total amount of ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: mergedData.summary.currency
        }).format(mergedData.summary.total_amount)}`,
      });

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

      {mergedData && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Merged Data Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Invoices</p>
              <p className="font-medium">{mergedData.summary.total_invoices}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: mergedData.summary.currency
                }).format(mergedData.summary.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date Range</p>
              <p className="font-medium">
                {format(new Date(mergedData.summary.date_range.earliest), 'MMM d, yyyy')} - {format(new Date(mergedData.summary.date_range.latest), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tax</p>
              <p className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: mergedData.summary.currency
                }).format(mergedData.summary.total_tax)}
              </p>
            </div>
          </div>
        </Card>
      )}

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