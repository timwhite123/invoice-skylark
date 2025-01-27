import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  FileCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Navigation = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

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

  return (
    <nav className="flex flex-col gap-2">
      <Link
        to="/invoices"
        className={`text-sm group flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
          ${location.pathname === "/invoices"
            ? "text-primary bg-primary/5"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
          }`}
      >
        <FileText className="w-4 h-4" />
        <span className="flex-1">Invoices</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {invoiceCount} processed
          </span>
          <ChevronRight className="w-4 h-4 transition-transform duration-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
        </div>
      </Link>

      <Link
        to="/account"
        className={`text-sm group flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
          ${location.pathname === "/account"
            ? "text-primary bg-primary/5"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
          }`}
      >
        <Settings className="w-4 h-4" />
        <span className="flex-1">Account</span>
        <ChevronRight className="w-4 h-4 transition-transform duration-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>

      <button
        onClick={() => signOut()}
        className="text-sm text-gray-600 hover:text-primary transition-colors group flex items-center gap-2 px-3 py-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </nav>
  );
};