import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        if (error.message === "User already registered") {
          toast({
            variant: "destructive",
            title: "Account already exists",
            description: "Please sign in instead or use a different email address.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          });
        }
        return;
      }

      toast({
        title: "Success!",
        description: "Your account has been created. You can now sign in.",
      });
      
      // Automatically switch to sign in tab after successful signup
      const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
      const signinTab = tabsList?.querySelector('[value="signin"]') as HTMLElement;
      signinTab?.click();
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Success!",
        description: "Please check your email for the reset link.",
      });
      setResetPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="w-full max-w-xs p-6 space-y-4">
          <div className="space-y-2">
            <img 
              src="https://shhnbluomlzqhdhvlppq.supabase.co/storage/v1/object/public/Logos%20and%20Images/invoicejet_logo.svg"
              alt="InvoiceJet.ai"
              className="h-5 w-auto mx-auto"
            />
            <p className="text-xs text-gray-500 text-center">Transforming Invoices. Made Easy.</p>
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold">Reset Password</h1>
            <p className="text-xs text-gray-500">Enter your email to reset your password</p>
          </div>
          <form onSubmit={handlePasswordReset} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>
            <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-8 text-sm"
              onClick={() => setResetPassword(false)}
            >
              Back to Sign In
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <Card className="w-full max-w-xs p-6">
        <div className="space-y-2 mb-4">
          <img 
            src="https://shhnbluomlzqhdhvlppq.supabase.co/storage/v1/object/public/Logos%20and%20Images/invoicejet_logo.svg"
            alt="InvoiceJet.ai"
            className="h-5 w-auto mx-auto"
          />
          <p className="text-xs text-gray-500 text-center">Transforming Invoices. Made Easy.</p>
        </div>
        <Tabs defaultValue="signin" className="space-y-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <div className="space-y-3">
              <div className="space-y-1 text-center">
                <h1 className="text-lg font-semibold">Welcome back</h1>
                <p className="text-xs text-gray-500">Sign in to your account</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="signin-email" className="text-sm">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signin-password" className="text-sm">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-xs px-0 h-6"
                  onClick={() => setResetPassword(true)}
                >
                  Forgot password?
                </Button>
                <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-3">
              <div className="space-y-1 text-center">
                <h1 className="text-lg font-semibold">Create an account</h1>
                <p className="text-xs text-gray-500">Enter your details to get started</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-sm">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-sm">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
