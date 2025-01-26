import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  currency: string;
  status: string;
}

interface MergeTableProps {
  invoices: Invoice[];
  selectedInvoices: string[];
  onToggleSelect: (invoiceId: string) => void;
  isMerging: boolean;
}

export const MergeTable = ({ 
  invoices, 
  selectedInvoices, 
  onToggleSelect, 
  isMerging 
}: MergeTableProps) => {
  return (
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
                  onCheckedChange={() => onToggleSelect(invoice.id)}
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
  );
};