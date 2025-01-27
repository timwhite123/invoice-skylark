import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  children?: ReactNode;
}

export const NavLink = ({ to, icon, label, isActive, children }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={`text-sm group flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
        ${isActive
          ? "text-primary bg-primary/5"
          : "text-gray-600 hover:text-primary hover:bg-primary/5"
        }`}
    >
      {icon}
      <span>{label}</span>
      {children}
      <ChevronRight className="w-4 h-4 transition-transform duration-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
    </Link>
  );
};