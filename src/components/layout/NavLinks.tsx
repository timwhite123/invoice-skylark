import { useLocation } from "react-router-dom";
import { FileText, Home } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "./NavLink";
import { InvoiceCountPill } from "./InvoiceCountPill";

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
      <NavLink
        to="/"
        icon={<Home className="w-4 h-4" />}
        label="Home"
        isActive={location.pathname === "/"}
      />

      <NavLink
        to="/invoices"
        icon={<FileText className="w-4 h-4" />}
        label="Invoices"
        isActive={location.pathname === "/invoices"}
      >
        <InvoiceCountPill 
          count={invoiceCount} 
          subscriptionTier={profile?.subscription_tier} 
        />
      </NavLink>
    </div>
  );
};