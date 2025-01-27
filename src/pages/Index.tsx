import { Button } from "@/components/ui/button";
import { InvoiceUpload } from "@/components/invoices/InvoiceUpload";
import { InvoiceMerge } from "@/components/invoices/InvoiceMerge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import { FileUp, History } from "lucide-react";
import { useFileUpload } from "@/components/invoices/upload/useFileUpload";

type SubscriptionTier = 'free' | 'pro' | 'enterprise';

const Index = () => {
  const { user } = useAuth();

  // Fetch user's subscription status
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  // Fetch latest invoices to determine if we should show empty state
  const { data: invoices } = useQuery({
    queryKey: ['latest-invoices'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const userPlan = (profile?.subscription_tier || 'free') as SubscriptionTier;
  const hasInvoices = invoices && invoices.length > 0;
  const { handleDrop } = useFileUpload(userPlan);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <EmptyState
          title="Welcome to InvoiceJet.ai!"
          description="Sign in to start processing and managing your invoices efficiently."
          icon={<FileUp className="w-full h-full" />}
          action={{
            label: "Sign In",
            onClick: () => window.location.href = '/auth'
          }}
          className="min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary/20 transition-colors"
        />
      </div>
    );
  }

  if (!hasInvoices) {
    return (
      <div className="container mx-auto py-8">
        <EmptyState
          title="Welcome to InvoiceJet.ai!"
          description="Upload your first invoice to get started. We'll help you process and manage your invoices efficiently."
          icon={<FileUp className="w-full h-full" />}
          action={{
            label: "Upload Your First Invoice",
            onClick: () => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = '.pdf';
              fileInput.click();
              fileInput.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  handleDrop([file]);
                }
              };
            }
          }}
          className="min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary/20 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-gray-600">
          Process your invoices quickly and efficiently with InvoiceJet.ai
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          <TabsTrigger value="merge">Merge Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <InvoiceUpload userPlan={userPlan} />
        </TabsContent>

        <TabsContent value="merge">
          <InvoiceMerge userPlan={userPlan} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;