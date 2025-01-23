import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Search, Trash2, Merge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TagManager } from "@/components/invoices/TagManager";
import { ExportMenu } from "@/components/invoices/ExportMenu";

// Mock user plan for now - will be replaced with actual user plan from Supabase
const userPlan = "free"; // "free" | "pro" | "enterprise"

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const { toast } = useToast();

  // Temporary mock data until we connect to Supabase
  const mockInvoices = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    invoiceNumber: `INV-${2024}${String(i + 1).padStart(4, "0")}`,
    vendor: `Vendor ${i + 1}`,
    dueDate: new Date(2024, 1, i + 15).toLocaleDateString(),
    amount: `$${(Math.random() * 1000).toFixed(2)}`,
    tags: [] as string[],
  }));

  const filteredInvoices = mockInvoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleExport = (format: string) => {
    toast({
      title: "Export started",
      description: `Exporting selected invoices as ${format.toUpperCase()}`,
    });
    // Export logic will be implemented later
  };

  const handleMerge = () => {
    if (userPlan === "free") {
      toast({
        title: "Feature not available",
        description: "Upgrade to Pro or Enterprise to merge invoices.",
        variant: "destructive",
      });
      return;
    }

    if (selectedInvoices.length < 2) {
      toast({
        title: "Select invoices",
        description: "Please select at least 2 invoices to merge.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Merging invoices",
      description: `Merging ${selectedInvoices.length} invoices`,
    });
    // Merge logic will be implemented later
  };

  const handleDelete = () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "Select invoices",
        description: "Please select at least one invoice to delete.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleting invoices",
      description: `Deleting ${selectedInvoices.length} invoices`,
    });
    // Delete logic will be implemented later
  };

  const handleTagsUpdate = (invoiceId: number, newTags: string[]) => {
    // Update tags logic will be implemented later
    console.log("Updating tags for invoice", invoiceId, newTags);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoice History</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedInvoices.length > 0 && (
            <div className="flex items-center gap-2">
              <ExportMenu userPlan={userPlan} onExport={handleExport} />
              {selectedInvoices.length >= 2 && (
                <>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleMerge}
                    disabled={userPlan === "free"}
                  >
                    <Merge className="h-4 w-4" />
                    Merge
                  </Button>
                  <ExportMenu 
                    userPlan={userPlan} 
                    onExport={handleExport} 
                    isMerged={true}
                  />
                </>
              )}
              <Button 
                variant="outline" 
                className="gap-2 text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInvoices(paginatedInvoices.map(inv => inv.id));
                    } else {
                      setSelectedInvoices([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices([...selectedInvoices, invoice.id]);
                      } else {
                        setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableCell>
                <TableCell>{invoice.vendor}</TableCell>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell>
                  <TagManager
                    invoiceId={invoice.id}
                    currentTags={invoice.tags}
                    onTagsUpdate={(tags) => handleTagsUpdate(invoice.id, tags)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <ExportMenu userPlan={userPlan} onExport={handleExport} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={
                currentPage === totalPages ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default Invoices;