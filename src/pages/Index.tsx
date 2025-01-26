import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExportMenu } from "@/components/invoices/ExportMenu";
import { InvoiceUpload } from "@/components/invoices/InvoiceUpload";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [greeting, setGreeting] = useState("");
  const userPlan = "free";

  // Fetch latest processed invoice with error handling
  const { data: latestInvoice, isError, error } = useQuery({
    queryKey: ['latest-invoice'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest invoice:", error);
        throw error;
      }
      
      return data;
    }
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Message */}
          <div className="text-left">
            <h1 className="text-2xl font-bold text-primary-800 mb-2">{greeting}</h1>
            <p className="text-gray-600">Upload an invoice to get started with processing</p>
          </div>

          {/* Upload Section */}
          <div className="animate-fadeIn">
            <InvoiceUpload />
          </div>

          {/* Preview Section - Only shown after processing */}
          {latestInvoice && (
            <InvoicePreview
              fileUrl={latestInvoice.original_file_url}
              extractedData={{
                vendor_name: latestInvoice.vendor_name,
                invoice_number: latestInvoice.invoice_number,
                invoice_date: latestInvoice.invoice_date,
                due_date: latestInvoice.due_date,
                total_amount: latestInvoice.total_amount,
                currency: latestInvoice.currency,
              }}
            />
          )}

          {/* Export Section - Only shown after processing */}
          {latestInvoice && (
            <Card className="p-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <ExportMenu userPlan={userPlan} onExport={(format) => console.log(`Exporting as ${format}`)} />
                <p className="text-sm text-gray-500">
                  Need more export options?{' '}
                  <Link to="/pricing" className="text-primary hover:underline">
                    Upgrade your plan
                  </Link>
                </p>
              </div>
            </Card>
          )}

          {/* Recent Invoices */}
          <Card className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-primary-800">Recent Invoices</h2>
                <p className="text-sm text-gray-500">Your latest processed documents</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/invoices">View All</Link>
              </Button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No invoices processed yet</p>
              <p className="text-sm">Upload your first invoice to get started</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;