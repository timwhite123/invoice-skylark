import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, CreditCard, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Types for profile data
type Profile = {
  full_name: string | null;
  email: string;
};

const Account = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for plan information - this would come from your subscription service
  const planData = {
    plan: "Free",
    renewalDate: new Date().toISOString(),
    invoicesUsed: 3,
    invoicesLimit: 5,
    planFeatures: {
      free: [
        "Process up to 5 invoices/month",
        "7-day PDF storage",
        "Basic text export only",
        "AI-based data extraction",
        "Standard support",
      ],
      pro: [
        "Process up to 150 invoices/month",
        "30-day PDF storage",
        "AI-based data extraction",
        "Excel, CSV, JSON, and Text exports",
        "Smart invoice merging",
        "Priority support",
      ],
    },
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
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

    fetchProfile();
  }, [user, toast]);

  const isFreePlan = planData.plan === "Free";
  const usagePercentage = (planData.invoicesUsed / planData.invoicesLimit) * 100;

  const handleBillingPortal = () => {
    window.location.href = "https://billing.stripe.com/p/login/5kA00r5qu1HO5MsfYY";
  };

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

      {/* Profile Section */}
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

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan: {planData.plan}</CardTitle>
          <CardDescription>
            Your plan renews on {new Date(planData.renewalDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Invoice Usage</span>
              <span>{planData.invoicesUsed} / {planData.invoicesLimit}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          {/* Current Plan Features */}
          <div className="space-y-4">
            <h3 className="font-medium">Your Plan Includes:</h3>
            <ul className="space-y-2">
              {planData.planFeatures[isFreePlan ? 'free' : 'pro'].map((feature) => (
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

      {/* Pro Plan CTA (shown only for free users) */}
      {isFreePlan && (
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
              {planData.planFeatures.pro.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full sm:w-auto">
              Upgrade Now
              <ChevronRight className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Account;
