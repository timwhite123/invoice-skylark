import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/layout/Navigation";
import { AuthProvider } from "./lib/auth";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/account" element={<Account />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;