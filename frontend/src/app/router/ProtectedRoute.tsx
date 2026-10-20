// src/app/router/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { SuspenseFallback } from "@/shared/components/feedback/SuspenseFallback";

export function ProtectedRoute() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <SuspenseFallback />;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si debe cambiar clave y no está en la vista de cambio, redirigir
  if (
    session.user.mustChangePassword &&
    location.pathname !== "/force-change-password"
  ) {
    return <Navigate to="/force-change-password" replace />;
  }

  return <Outlet />;
}
