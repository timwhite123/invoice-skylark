import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const [greeting, setGreeting] = useState("");

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

          {/* Recent Invoices */}
          <Card className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-primary-800">Recent Invoices</h2>
                <p className="text-sm text-gray-500">Your latest processed documents</p>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No invoices processed yet</p>
              <p className="text-sm">Upload your first invoice to get started</p>
            </div>
          </Card>

          {/* Export Section */}
          <Card className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-primary-800">Export Options</h2>
                <p className="text-sm text-gray-500">Download your processed data</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export as Excel
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;