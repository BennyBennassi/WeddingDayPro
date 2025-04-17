import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, RouteProps, Redirect } from "wouter";

interface ProtectedRouteProps extends RouteProps {
  adminOnly?: boolean;
}

export function ProtectedRoute({
  path,
  children,
  adminOnly = false,
  ...rest
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path} {...rest}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path} {...rest}>
        <Redirect to="/" />
      </Route>
    );
  }

  if (adminOnly && !user.isAdmin) {
    return (
      <Route path={path} {...rest}>
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
          <Redirect to="/" />
        </div>
      </Route>
    );
  }

  return (
    <Route path={path} {...rest}>
      {children}
    </Route>
  );
}