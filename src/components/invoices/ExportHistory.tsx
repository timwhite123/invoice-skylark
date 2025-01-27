import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportRecord {
  id: string;
  file_name: string;
  created_at: string;
  export_format: string;
  file_size: number;
  file_url: string;
}

export const ExportHistory = () => {
  const { toast } = useToast();
  const [selectedExports, setSelectedExports] = useState<string[]>([]);

  const { data: exports, isLoading } = useQuery({
    queryKey: ['export-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExportRecord[];
    }
  });

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked && exports) {
                    setSelectedExports(exports.map(exp => exp.id));
                  } else {
                    setSelectedExports([]);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Export Date</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {exports?.map((exportRecord) => (
            <TableRow key={exportRecord.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedExports.includes(exportRecord.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedExports([...selectedExports, exportRecord.id]);
                    } else {
                      setSelectedExports(selectedExports.filter(id => id !== exportRecord.id));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>{exportRecord.file_name || 'Untitled'}</TableCell>
              <TableCell>
                {exportRecord.created_at 
                  ? format(new Date(exportRecord.created_at), 'MMM d, yyyy HH:mm')
                  : 'N/A'}
              </TableCell>
              <TableCell className="uppercase">{exportRecord.export_format || 'N/A'}</TableCell>
              <TableCell>{formatFileSize(exportRecord.file_size)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(exportRecord.file_url, exportRecord.file_name)}
                  disabled={!exportRecord.file_url}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!exports || exports.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No export history found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};