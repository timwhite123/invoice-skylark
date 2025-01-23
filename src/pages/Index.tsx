import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExportMenu } from "@/components/invoices/ExportMenu";

const Index = () => {
  const [greeting, setGreeting] = useState("");
  const [hasProcessedInvoices, setHasProcessedInvoices] = useState(false); // In a real app, this would come from your backend
  const userPlan = "free"; // This would come from your user context/auth

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Simulate checking for processed invoices
    // In a real app, this would be an API call
    setHasProcessedInvoices(true);
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
          <Card className="p-8 text-center animate-fadeIn bg-gradient-to-br from-[#1A89FD]/5 to-[#F95FBD]/5 border-[#1A89FD]/20 border-2 border-dashed hover:border-[#1A89FD]/40 hover:bg-[#1A89FD]/5 transition-all duration-300 cursor-pointer">
            <div className="mx-auto w-16 h-16 bg-[#1A89FD]/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-[#1A89FD]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#0036CA] mb-3">Upload up to 5 PDF Invoices</h2>
            <p className="text-gray-600 mb-2">10MB maximum per file</p>
            <p className="text-gray-500">Drag and drop your files here or click "Choose Files" to select them from your device</p>
            <Button 
              variant="outline" 
              className="mx-auto mt-6 bg-white hover:bg-[#1A89FD] hover:text-white transition-colors border-[#1A89FD]/30 text-[#0036CA] hover:border-transparent"
            >
              Choose Files
            </Button>
          </Card>

          {/* Export Section - Only shown after processing */}
          {hasProcessedInvoices && (
            <Card className="p-6 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-primary-800">Quick Export</h2>
                  <p className="text-sm text-gray-500">Export your processed invoices</p>
                </div>
                <Link to="/invoices">
                  <Button variant="outline" size="sm">
                    View All Invoices
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <ExportMenu userPlan={userPlan} onExport={(format) => console.log(`Exporting as ${format}`)} />
                <p className="text-sm text-gray-500">
                  Need more export options? 
                  <Link to="/pricing" className="text-primary ml-1 hover:underline">
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