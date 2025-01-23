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
import { Search, Trash2, Merge, ArrowUpDown, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TagManager } from "@/components/invoices/TagManager";
import { ExportMenu } from "@/components/invoices/ExportMenu";
import { Badge } from "@/components/ui/badge";

// Mock user plan for now - will be replaced with actual user plan from Supabase
const userPlan = "free"; // "free" | "pro" | "enterprise"

type SortDirection = "asc" | "desc" | null;
type SortField = "vendor" | "invoiceNumber" | "dueDate" | null;

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  // Temporary mock data until we connect to Supabase
  const mockInvoices = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    invoiceNumber: `INV-${2024}${String(i + 1).padStart(4, "0")}`,
    vendor: `Vendor ${i + 1}`,
    dueDate: new Date(2024, 1, i + 15).toLocaleDateString(),
    amount: `$${(Math.random() * 1000).toFixed(2)}`,
    tags: [`Tag ${i % 3 + 1}`, `Sample ${i % 2 + 1}`],
  }));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedInvoices = [...mockInvoices].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    
    const compareValue = (va: string, vb: string) => {
      return sortDirection === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    };

    switch (sortField) {
      case "vendor":
        return compareValue(a.vendor, b.vendor);
      case "invoiceNumber":
        return compareValue(a.invoiceNumber, b.invoiceNumber);
      case "dueDate":
        return compareValue(a.dueDate, b.dueDate);
      default:
        return 0;
    }
  });

  const filteredInvoices = sortedInvoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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
    const updatedInvoices = mockInvoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, tags: newTags }
        : invoice
    );
    // In a real application, this would be an API call
    console.log("Updated invoice tags:", { invoiceId, newTags });
    
    // Force a re-render by updating the search query
    setSearchQuery(searchQuery + " ");
    setTimeout(() => setSearchQuery(searchQuery.trim()), 0);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoice History</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices or tags..."
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

      <ScrollArea className="h-[600px] rounded-md border relative">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 h-10">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                    } else {
                      setSelectedInvoices([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
              <TableHead 
                className="h-10 text-xs font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("vendor")}
              >
                <div className="flex items-center gap-1">
                  Vendor
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="h-10 text-xs font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("invoiceNumber")}
              >
                <div className="flex items-center gap-1">
                  Invoice ID
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="h-10 text-xs font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("dueDate")}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="h-10 text-xs font-medium">Tags</TableHead>
              <TableHead className="text-right h-10 text-xs font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="h-12">
                <TableCell className="align-top pt-3">
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
                <TableCell className="text-sm">{invoice.vendor}</TableCell>
                <TableCell className="text-sm">{invoice.invoiceNumber}</TableCell>
                <TableCell className="text-sm">{invoice.dueDate}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2 items-center">
                    {invoice.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <TagManager
                      invoiceId={invoice.id}
                      currentTags={invoice.tags}
                      onTagsUpdate={(tags) => handleTagsUpdate(invoice.id, tags)}
                    />
                  </div>
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
