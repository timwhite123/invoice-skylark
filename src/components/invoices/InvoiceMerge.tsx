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
import { Loader2, Lock, Upload, Crown, ArrowRight } from "lucide-react";
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

interface InvoiceMergeProps {
  userPlan?: 'free' | 'pro' | 'enterprise';
}

export const InvoiceMerge = ({ userPlan = 'free' }: InvoiceMergeProps) => {
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

  if (userPlan === 'free') {
    return (
      <div className="relative overflow-hidden">
        <div className="flex flex-col items-center justify-center p-16 space-y-8 text-center border-2 border-dashed rounded-lg bg-gradient-to-b from-background to-background/50">
          {/* Premium Badge */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              Premium Feature
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 rounded-full bg-primary/10">
            <Lock className="h-16 w-16 text-primary" />
          </div>
          
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Unlock Invoice Merging
            </h2>
            <p className="text-muted-foreground">
              Combine multiple invoices into a single document, streamline your workflow, 
              and save time with our powerful merging feature. Available on Pro and Enterprise plans.
            </p>
          </div>

          {/* Feature List */}
          <div className="grid gap-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Merge unlimited invoices into a single document
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Export merged data in multiple formats
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Smart data consolidation and validation
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={() => navigate("/pricing")} 
              size="lg"
              className="gap-2"
            >
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              variant="outline"
              size="lg"
            >
              Back to Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

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