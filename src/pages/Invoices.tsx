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
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, Trash2, Merge, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
    date: new Date(2024, 0, i + 1).toLocaleDateString(),
    amount: `$${(Math.random() * 1000).toFixed(2)}`,
    status: i % 3 === 0 ? "Processed" : i % 3 === 1 ? "Pending" : "Failed",
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

  const handleExport = (format: "text" | "csv" | "json" | "excel", isMerged: boolean = false) => {
    if (userPlan === "free" && format !== "text") {
      toast({
        title: "Feature not available",
        description: "Upgrade to Pro or Enterprise to access additional export formats.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Export started",
      description: `Exporting ${isMerged ? 'merged' : 'selected'} invoices as ${format.toUpperCase()}`,
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Export Selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("text")}>
                    Text
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport("csv")}
                    className={userPlan === "free" ? "opacity-50" : ""}
                  >
                    CSV {userPlan === "free" && "(Pro)"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport("json")}
                    className={userPlan === "free" ? "opacity-50" : ""}
                  >
                    JSON {userPlan === "free" && "(Pro)"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport("excel")}
                    className={userPlan === "free" ? "opacity-50" : ""}
                  >
                    Excel {userPlan === "free" && "(Pro)"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        disabled={userPlan === "free"}
                      >
                        <FileDown className="h-4 w-4" />
                        Export Merged
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExport("text", true)}>
                        Text
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport("csv", true)}
                        className={userPlan === "free" ? "opacity-50" : ""}
                      >
                        CSV {userPlan === "free" && "(Pro)"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport("json", true)}
                        className={userPlan === "free" ? "opacity-50" : ""}
                      >
                        JSON {userPlan === "free" && "(Pro)"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport("excel", true)}
                        className={userPlan === "free" ? "opacity-50" : ""}
                      >
                        Excel {userPlan === "free" && "(Pro)"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <TableHead>Invoice Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.vendor}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{invoice.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === "Processed"
                        ? "default"
                        : invoice.status === "Pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Tag className="h-4 w-4" />
                        Manage Tags
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage Tags</DialogTitle>
                        <DialogDescription>
                          Add or remove tags for invoice {invoice.invoiceNumber}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge>Example Tag</Badge>
                        <Button variant="outline" size="sm">
                          + Add Tag
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("View details for invoice:", invoice.id);
                    }}
                  >
                    View Details
                  </Button>
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