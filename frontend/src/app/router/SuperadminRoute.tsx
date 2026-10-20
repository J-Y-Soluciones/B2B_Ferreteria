// src/app/router/SuperadminRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { SuspenseFallback } from "@/shared/components/feedback/SuspenseFallback";

export function SuperadminRoute() {
  const { session, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SuspenseFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verifica el rol en el usuario de sesión
  const userRole = (session?.user as unknown as { role?: string })?.role;
  if (userRole !== "SUPERADMIN") {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
