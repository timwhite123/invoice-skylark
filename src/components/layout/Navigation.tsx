import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { AccountDropdown } from "./AccountDropdown";

export const Navigation = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center space-x-8">
        <Logo />
        <NavLinks />
      </div>

      <div className="flex items-center space-x-2">
        <AccountDropdown />
      </div>
    </nav>
  );
};