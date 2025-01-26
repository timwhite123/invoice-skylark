import { Button } from "@/components/ui/button";
import { InvoiceUpload } from "@/components/invoices/InvoiceUpload";
import { FieldMappingManager } from "@/components/field-mapping/FieldMappingManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Invoice Processing</h1>
      
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <InvoiceUpload />
        </TabsContent>

        <TabsContent value="mapping">
          <FieldMappingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;