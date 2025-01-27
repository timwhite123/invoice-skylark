import { Link } from "react-router-dom";

export const Logo = () => (
  <Link to="/" className="flex items-center">
    <img 
      src="https://shhnbluomlzqhdhvlppq.supabase.co/storage/v1/object/public/Logos%20and%20Images/invoicejet_logo.svg" 
      alt="InvoiceJet.ai Logo" 
      className="h-6" 
    />
  </Link>
);