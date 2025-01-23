import { ChevronDown, FileText, Home, LogOut, Menu, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// Mock data - replace with actual data when connected to backend
const userPlan = {
  type: "free",
  processedInvoices: 3,
  monthlyLimit: 5,
};

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const UsageStats = () => (
    <Link 
      to="/pricing" 
      className="text-sm text-gray-600 hover:text-primary transition-colors group flex items-center gap-2"
    >
      <div className="flex flex-col">
        <span className="font-medium capitalize">{userPlan.type} Plan</span>
        <span className="text-xs">
          {userPlan.processedInvoices}/{userPlan.monthlyLimit} invoices used
        </span>
      </div>
      <span className="hidden group-hover:inline text-xs text-primary font-medium">
        Upgrade →
      </span>
    </Link>
  );

  return (
    <NavigationMenu className="max-w-none w-full bg-white border-b">
      <div className="container mx-auto py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">InvoiceJet.ai</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <UsageStats />

                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link to="/">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        <Home className="mr-2 h-4 w-4" />
                        Home
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/invoices">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        <FileText className="mr-2 h-4 w-4" />
                        Invoices
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <User className="h-4 w-4" />
                      Account
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pricing" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Plans & Pricing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-8 mt-8">
                  {user ? (
                    <>
                      <UsageStats />
                      
                      <nav className="flex flex-col gap-4">
                        <Link 
                          to="/" 
                          className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                        >
                          <Home className="h-5 w-5" />
                          Home
                        </Link>
                        <Link 
                          to="/invoices" 
                          className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                          Invoices
                        </Link>
                      </nav>

                      <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground">Account</h3>
                        <nav className="flex flex-col gap-4">
                          <Link 
                            to="/account" 
                            className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                          >
                            <User className="h-5 w-5" />
                            My Account
                          </Link>
                          <Link 
                            to="/pricing" 
                            className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                          >
                            <FileText className="h-5 w-5" />
                            Plans & Pricing
                          </Link>
                          <button 
                            onClick={signOut}
                            className="flex items-center gap-2 text-lg font-medium text-red-600 hover:text-red-700 transition-colors"
                          >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                          </button>
                        </nav>
                      </div>
                    </>
                  ) : (
                    <Button onClick={() => navigate("/auth")} className="w-full">
                      Sign In
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </NavigationMenu>
  );
};