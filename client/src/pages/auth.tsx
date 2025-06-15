import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { Loading } from "@/components/ui/loading";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { signIn, signUp, user, loading: authLoading, authEnabled } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/app");
    }
  }, [user, authLoading, setLocation]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      setLocation("/app");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, fullName, phone);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      // Note: User will be redirected automatically once session is established
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "signup");
    resetForm();
  };

  if (authLoading) {
    return <Loading text="Initializing..." />
  }

  // If auth is not enabled, show a message
  if (!authEnabled) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
        <div className="absolute inset-0">
          <SparklesBackground />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <Card className="w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-black dark:text-white">
                Authentication Required
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Supabase authentication is not configured. Please add your Supabase credentials to the .env file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">To enable authentication, add these to your .env file:</p>
                <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">
                  VITE_SUPABASE_URL=your-project-url<br/>
                  VITE_SUPABASE_ANON_KEY=your-anon-key
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Sparkles Background - respects dark/light mode */}
      <div className="absolute inset-0">
        <SparklesBackground />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Conquer Header */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-black dark:text-white">
            Conquer
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Your AI-powered companion awaits
          </p>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-black dark:text-white">
              {activeTab === "login" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {activeTab === "login" 
                ? "Sign in to your KAI account" 
                : "Sign up to get started with KAI"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name *
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signupEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signupPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password *
                    </label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 