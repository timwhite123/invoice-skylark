import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Settings, LogOut, ChevronDown, CreditCard, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AccountDropdown = () => {
  const { signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-md hover:text-primary hover:bg-primary/5 transition-all duration-200">
        <Settings className="w-4 h-4" />
        <span>Account</span>
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2 w-full cursor-pointer">
            <User className="w-4 h-4" />
            <span>My Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/pricing" className="flex items-center gap-2 w-full cursor-pointer">
            <CreditCard className="w-4 h-4" />
            <span>Plans & Pricing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};