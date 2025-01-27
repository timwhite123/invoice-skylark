import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvoiceCountPillProps {
  count: number;
  subscriptionTier?: string;
}

export const InvoiceCountPill = ({ count, subscriptionTier }: InvoiceCountPillProps) => {
  if (count === 0) return null;

  if (subscriptionTier === 'free') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              to="/pricing"
              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors group/pill flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {count} processed
              <Plus className="w-3 h-3 opacity-0 group-hover/pill:opacity-100 transition-opacity" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade to process more invoices</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
      {count} processed
    </span>
  );
};