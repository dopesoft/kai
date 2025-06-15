import { Switch, Route } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/use-auth";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

// Lazy load heavy components
const Landing = lazy(() => import("@/pages/Landing"));
const Chat = lazy(() => import("@/pages/chat"));
const Settings = lazy(() => import("@/pages/settings"));
const Memory = lazy(() => import("@/pages/memory"));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="text-gray-100">Loading...</div>
  </div>
);

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

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Landing />
    </Suspense>
  );
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
          <Suspense fallback={<LoadingSpinner />}>
            <Chat />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard requireAuth={true}>
          <Suspense fallback={<LoadingSpinner />}>
            <Settings />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/memory">
        <AuthGuard requireAuth={true}>
          <Suspense fallback={<LoadingSpinner />}>
            <Memory />
          </Suspense>
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
