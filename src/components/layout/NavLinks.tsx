import { Link, useLocation } from "react-router-dom";
import { FileText, ChevronRight, Home, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const NavLinks = () => {
  const location = useLocation();
  const { user } = useAuth();

  const { data: invoiceCount = 0 } = useQuery({
    queryKey: ['processed-invoices-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'processed');

      if (error) {
        console.error('Error fetching invoice count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
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

  return (
    <div className="flex items-center space-x-2">
      <Link
        to="/"
        className={`text-sm group flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
          ${location.pathname === "/"
            ? "text-primary bg-primary/5"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
          }`}
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
        <ChevronRight className="w-4 h-4 transition-transform duration-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>

      <Link
        to="/invoices"
        className={`text-sm group flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
          ${location.pathname === "/invoices"
            ? "text-primary bg-primary/5"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
          }`}
      >
        <FileText className="w-4 h-4" />
        <span>Invoices</span>
        {invoiceCount > 0 && profile?.subscription_tier === 'free' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to="/pricing"
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors group/pill flex items-center gap-1"
                >
                  {invoiceCount} processed
                  <Plus className="w-3 h-3 opacity-0 group-hover/pill:opacity-100 transition-opacity" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upgrade to process more invoices</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {invoiceCount > 0 && profile?.subscription_tier !== 'free' && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {invoiceCount} processed
          </span>
        )}
        <ChevronRight className="w-4 h-4 transition-transform duration-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>
    </div>
  );
};