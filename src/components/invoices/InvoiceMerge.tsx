import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreePlanEmptyState } from "./FreePlanEmptyState";
import { MergeDataSummary } from "./MergeDataSummary";
import { MergeTable } from "./MergeTable";

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

export const InvoiceMerge = ({ userPlan }: InvoiceMergeProps) => {
  console.log('InvoiceMerge userPlan:', userPlan); // Debug log

  // Early return for free plan users
  if (!userPlan || userPlan === 'free') {
    console.log('Showing FreePlanEmptyState for plan:', userPlan); // Debug log
    return <FreePlanEmptyState />;
  }

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

      {mergedData && <MergeDataSummary summary={mergedData.summary} />}

      <MergeTable 
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        onToggleSelect={handleToggleSelect}
        isMerging={isMerging}
      />
    </div>
  );
};