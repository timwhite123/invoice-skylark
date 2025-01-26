import { Button } from "@/components/ui/button";
import { InvoiceUpload } from "@/components/invoices/InvoiceUpload";
import { InvoiceMerge } from "@/components/invoices/InvoiceMerge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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

  // Default to 'free' if profile is not loaded or subscription_tier is null
  const userPlan = profile?.subscription_tier || 'free';

  console.log('Current user plan:', userPlan); // Add this for debugging

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Invoice Processing</h1>
      
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