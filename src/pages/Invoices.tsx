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
import { Search, Trash2, Merge, ArrowUpDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TagManager } from "@/components/invoices/TagManager";
import { ExportMenu } from "@/components/invoices/ExportMenu";
import { Badge } from "@/components/ui/badge";
import { ExportHistory } from "@/components/invoices/ExportHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Mock user plan for now - will be replaced with actual user plan from Supabase
const userPlan = "free"; // "free" | "pro" | "enterprise"

type SortDirection = "asc" | "desc" | null;
type SortField = "vendor_name" | "invoice_number" | "due_date" | null;

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (sortField && sortDirection) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error fetching invoices",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', invoiceIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedInvoices.length} invoice(s)`,
      });
      setSelectedInvoices([]);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting invoices",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

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

  const handleDelete = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "Select invoices",
        description: "Please select at least one invoice to delete.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteInvoiceMutation.mutateAsync(selectedInvoices);
    } catch (error) {
      console.error("Error in handleDelete:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoices</h1>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="export-history">Export History</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
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
                    disabled={deleteInvoiceMutation.isPending}
                  >
                    {deleteInvoiceMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[600px] rounded-md border relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
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
                        onClick={() => setSortField(sortField === "vendor_name" ? null : "vendor_name")}
                      >
                        <div className="flex items-center gap-1">
                          Vendor
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 text-xs font-medium cursor-pointer hover:bg-muted/50"
                        onClick={() => setSortField(sortField === "invoice_number" ? null : "invoice_number")}
                      >
                        <div className="flex items-center gap-1">
                          Invoice ID
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 text-xs font-medium cursor-pointer hover:bg-muted/50"
                        onClick={() => setSortField(sortField === "due_date" ? null : "due_date")}
                      >
                        <div className="flex items-center gap-1">
                          Due Date
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right h-10 text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {paginatedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInvoices.map((invoice) => (
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
                          <TableCell className="text-sm">{invoice.vendor_name || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{invoice.invoice_number || 'N/A'}</TableCell>
                          <TableCell className="text-sm">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <ExportMenu userPlan={userPlan} onExport={handleExport} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
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
        </TabsContent>
        <TabsContent value="export-history" className="mt-6">
          <ExportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invoices;
