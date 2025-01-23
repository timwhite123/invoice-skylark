import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Free",
      monthlyPrice: "0",
      annualPrice: "0",
      description: "Perfect for getting started",
      features: [
        "Process up to 5 invoices/month",
        "7-day PDF storage",
        "Basic text export only",
        "AI-based data extraction",
        "Standard support",
      ],
      buttonText: "Current Plan",
      popular: false,
      buttonVariant: "outline" as const,
    },
    {
      name: "Pro",
      monthlyPrice: "19.97",
      annualPrice: "199.70",
      description: "Great for small businesses",
      features: [
        "Process up to 150 invoices/month",
        "30-day PDF storage",
        "AI-based data extraction",
        "Excel, CSV, JSON, and Text exports",
        "Smart invoice merging",
        "Priority support",
      ],
      buttonText: "Upgrade to Pro",
      popular: true,
      buttonVariant: "default" as const,
    },
    {
      name: "Enterprise",
      monthlyPrice: "54.98",
      annualPrice: "549.80",
      description: "For large organizations",
      features: [
        "Unlimited invoice processing",
        "90-day PDF storage",
        "AI-based data extraction",
        "Excel, CSV, JSON, and Text exports",
        "Smart invoice merging",
        "Tailored solutions for teams (coming soon)",
        "Premium support",
      ],
      buttonText: "Get Started",
      popular: false,
      buttonVariant: "default" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            Choose the plan that's right for you
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!isAnnual ? 'font-semibold' : ''}`}>Monthly</span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm ${isAnnual ? 'font-semibold' : ''}`}>
              Annual
              <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 ml-2">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                  {isAnnual && plan.name !== 'Free' && (
                    <div className="mt-1 text-sm text-green-600">
                      2 months free
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  variant={plan.buttonVariant}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500">
            All plans include automatic invoice processing, secure storage, and dedicated support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;