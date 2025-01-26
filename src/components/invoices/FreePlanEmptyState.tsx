import { Crown, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const FreePlanEmptyState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative overflow-hidden">
      <div className="flex flex-col items-center justify-center p-16 space-y-8 text-center border-2 border-dashed rounded-lg bg-gradient-to-b from-background to-background/50">
        {/* Premium Badge */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <Crown className="h-4 w-4" />
            Premium Feature
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 rounded-full bg-primary/10">
          <Lock className="h-16 w-16 text-primary" />
        </div>
        
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Unlock Invoice Merging
          </h2>
          <p className="text-muted-foreground">
            Combine multiple invoices into a single document, streamline your workflow, 
            and save time with our powerful merging feature. Available on Pro and Enterprise plans.
          </p>
        </div>

        {/* Feature List */}
        <div className="grid gap-4 text-left text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Merge unlimited invoices into a single document
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Export merged data in multiple formats
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Smart data consolidation and validation
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button 
            onClick={() => navigate("/pricing")} 
            size="lg"
            className="gap-2"
          >
            Upgrade Now
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => navigate("/")} 
            variant="outline"
            size="lg"
          >
            Back to Upload
          </Button>
        </div>
      </div>
    </div>
  );
};