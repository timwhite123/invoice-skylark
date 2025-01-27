import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, CreditCard, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Json } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";

type Profile = {
  full_name: string | null;
  email: string;
  subscription_tier: string;
};

type SubscriptionTier = {
  name: string;
  stripe_price_id: string;
  monthly_export_limit: number;
  features: Json;
  id: string;
  file_size_limit_mb: number;
  created_at: string;
  updated_at: string;
};

const Account = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: invoicesCount = 0 } = useQuery({
    queryKey: ['invoices-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Subscription updated",
        description: "Thank you for your subscription! Your account has been updated.",
      });
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        description: "Subscription update canceled. No changes were made.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const fetchProfileAndSubscription = async () => {
      try {
        if (!user) return;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, subscription_tier')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);

        if (profileData.subscription_tier) {
          const { data: tierData, error: tierError } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('name', profileData.subscription_tier)
            .single();

          if (tierError) throw tierError;
          setCurrentTier(tierData);
        }

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching profile",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndSubscription();
  }, [user, toast]);

  const handleUpgradeClick = async (priceId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');

      const response = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
      });
      console.error('Checkout error:', error);
    }
  };

  const handleBillingPortal = () => {
    window.location.href = "https://billing.stripe.com/p/login/5kA00r5qu1HO5MsfYY";
  };

  const usagePercentage = currentTier 
    ? (invoicesCount / currentTier.monthly_export_limit) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Manage your account details and subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-lg">{profile?.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-lg">{profile?.email || user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan: {currentTier?.name.charAt(0).toUpperCase() + currentTier?.name.slice(1)}</CardTitle>
            <CardDescription>
              Your monthly invoice processing allowance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Invoice Usage</span>
                <span>{invoicesCount} / {currentTier?.monthly_export_limit}</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Your Plan Includes:</h3>
              <ul className="space-y-2">
                {Array.isArray(currentTier?.features) && currentTier?.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleBillingPortal}>
              <CreditCard className="mr-2" />
              Manage Billing
            </Button>
          </CardFooter>
        </Card>

        {profile?.subscription_tier === 'free' && (
          <Card className="bg-brand-green-light border-brand-green/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Unlock Pro Features
              </CardTitle>
              <CardDescription>Get access to advanced features and more invoices per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Process up to 150 invoices/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Excel, CSV, JSON, and Text exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Smart invoice merging</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>30-day PDF storage</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full sm:w-auto group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]" 
                onClick={() => handleUpgradeClick('price_1QfoT0LE6W0PtlHKSGyUhUtI')}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Upgrade Now
                  <ChevronRight className="ml-2 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-brand-blue-dark opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Account;