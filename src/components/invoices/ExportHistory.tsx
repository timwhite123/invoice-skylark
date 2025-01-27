import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Trash2, Filter, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type SortField = "created_at" | "file_name" | "file_size" | null;
type SortDirection = "asc" | "desc" | null;

export const ExportHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();

  const { data: exports, isLoading } = useQuery({
    queryKey: ["export-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("export_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async () => {
    if (selectedExports.length === 0) {
      toast({
        title: "No exports selected",
        description: "Please select at least one export to delete.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("export_history")
        .delete()
        .in("id", selectedExports);

      if (error) throw error;

      toast({
        title: "Exports deleted",
        description: `Successfully deleted ${selectedExports.length} exports`,
      });
      
      setSelectedExports([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete exports. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (fileUrl: string) => {
    try {
      window.open(fileUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredExports = exports?.filter(
    (export_) =>
      export_.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      export_.export_format?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const sortedExports = [...filteredExports].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    
    const compareValue = (va: any, vb: any) => {
      if (typeof va === "string" && typeof vb === "string") {
        return sortDirection === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDirection === "asc" ? va - vb : vb - va;
    };

    return compareValue(a[sortField], b[sortField]);
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedExports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExports = sortedExports.slice(startIndex, startIndex + itemsPerPage);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedExports.length > 0 && (
          <Button 
            variant="outline" 
            className="gap-2 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        )}
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
                      setSelectedExports(filteredExports.map(exp => exp.id));
                    } else {
                      setSelectedExports([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("file_name")}
              >
                <div className="flex items-center gap-1">
                  File Name
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  Export Date
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Format</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("file_size")}
              >
                <div className="flex items-center gap-1">
                  Size
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading exports...
                </TableCell>
              </TableRow>
            ) : paginatedExports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No exports found
                </TableCell>
              </TableRow>
            ) : (
              paginatedExports.map((export_) => (
                <TableRow key={export_.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedExports.includes(export_.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExports([...selectedExports, export_.id]);
                        } else {
                          setSelectedExports(selectedExports.filter(id => id !== export_.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>{export_.file_name || "Untitled"}</TableCell>
                  <TableCell>
                    {export_.created_at ? format(new Date(export_.created_at), "PPp") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {export_.export_format?.toUpperCase() || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(export_.file_size)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => export_.file_url && handleDownload(export_.file_url)}
                      disabled={!export_.file_url}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
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
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};