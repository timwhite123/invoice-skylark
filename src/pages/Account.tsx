import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, CreditCard, Star } from "lucide-react";

// Mock data - replace with real data from backend
const userData = {
  name: "John Doe",
  email: "john@example.com",
  plan: "Free",
  renewalDate: "2024-05-01",
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

const Account = () => {
  const isFreePlan = userData.plan === "Free";
  const usagePercentage = (userData.invoicesUsed / userData.invoicesLimit) * 100;

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
            <p className="text-lg">{userData.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-lg">{userData.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan: {userData.plan}</CardTitle>
          <CardDescription>
            Your plan renews on {new Date(userData.renewalDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Invoice Usage</span>
              <span>{userData.invoicesUsed} / {userData.invoicesLimit}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          {/* Current Plan Features */}
          <div className="space-y-4">
            <h3 className="font-medium">Your Plan Includes:</h3>
            <ul className="space-y-2">
              {userData.planFeatures[isFreePlan ? 'free' : 'pro'].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="w-full sm:w-auto">
            <CreditCard className="mr-2" />
            Manage Billing
          </Button>
        </CardFooter>
      </Card>

      {/* Pro Plan CTA (shown only for free users) */}
      {isFreePlan && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Unlock Pro Features
            </CardTitle>
            <CardDescription>Get access to advanced features and more invoices per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {userData.planFeatures.pro.map((feature) => (
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