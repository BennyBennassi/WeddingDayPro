import { useState, useCallback } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Layout from "@/components/layout/layout";

function Router() {
  // State for save/share handlers to be passed to the Home component
  const [saveHandler, setSaveHandler] = useState<(() => void) | undefined>(undefined);
  const [shareHandler, setShareHandler] = useState<(() => void) | undefined>(undefined);
  
  // Callback to capture save handler from Home component
  const captureSaveHandler = useCallback((handler: () => void) => {
    setSaveHandler(() => handler);
  }, []);
  
  // Callback to capture share handler from Home component
  const captureShareHandler = useCallback((handler: () => void) => {
    setShareHandler(() => handler);
  }, []);
  
  return (
    <>
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>
        
        <Route>
          <Layout onSave={saveHandler} onShare={shareHandler}>
            <Switch>
              <Route path="/">
                {() => (
                  <Home 
                    provideSaveHandler={captureSaveHandler}
                    provideShareHandler={captureShareHandler}
                  />
                )}
              </Route>
              <ProtectedRoute path="/admin" adminOnly={true}>
                <AdminPage />
              </ProtectedRoute>
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
