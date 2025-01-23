import { ChevronDown, FileText, Home, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
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
import { cn } from "@/lib/utils";

// Mock data - replace with actual data when connected to backend
const userPlan = {
  type: "free",
  processedInvoices: 3,
  monthlyLimit: 5,
};

export const Navigation = () => {
  return (
    <NavigationMenu className="max-w-none w-full bg-white border-b">
      <div className="container mx-auto py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">InvoiceJet.ai</span>
          </Link>

          <div className="flex items-center gap-8">
            {/* Usage Stats */}
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

            {/* Main Navigation */}
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

            {/* User Menu */}
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
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </NavigationMenu>
  );
};