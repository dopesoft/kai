import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";
import Memory from "@/pages/memory";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthGuard requireAuth={false}>
          <Auth />
        </AuthGuard>
      </Route>
      <Route path="/">
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
