import { Card } from "@/components/ui/card";
import { format } from "date-fns";

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

interface MergeDataSummaryProps {
  summary: MergedInvoiceSummary;
}

export const MergeDataSummary = ({ summary }: MergeDataSummaryProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Merged Data Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="font-medium">{summary.total_invoices}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: summary.currency
            }).format(summary.total_amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date Range</p>
          <p className="font-medium">
            {format(new Date(summary.date_range.earliest), 'MMM d, yyyy')} - {format(new Date(summary.date_range.latest), 'MMM d, yyyy')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Tax</p>
          <p className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: summary.currency
            }).format(summary.total_tax)}
          </p>
        </div>
      </div>
    </Card>
  );
};