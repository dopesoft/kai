import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/use-auth";
import Landing from "@/pages/Landing";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";
import Memory from "@/pages/memory";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function LandingOrDashboard() {
  const { user, loading, authEnabled } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (authEnabled && user) {
        // User is authenticated, redirect to dashboard
        setLocation('/app');
      }
      // If not authenticated, show landing page (default behavior)
    }
  }, [user, loading, authEnabled, setLocation]);

  // Show landing page for unauthenticated users or when auth is disabled
  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-100">Loading...</div>
    </div>;
  }

  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthGuard requireAuth={false}>
          <Auth />
        </AuthGuard>
      </Route>
      <Route path="/">
        <LandingOrDashboard />
      </Route>
      <Route path="/app">
        <AuthGuard requireAuth={true}>
          <Chat />
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard requireAuth={true}>
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/memory">
        <AuthGuard requireAuth={true}>
          <Memory />
        </AuthGuard>
      </Route>
      <Route>
        <AuthGuard requireAuth={true}>
          <NotFound />
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
