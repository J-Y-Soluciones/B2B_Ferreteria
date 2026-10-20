// src/routes/guards/SuperadminGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function SuperadminGuard() {
  const { session, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas font-mono text-xs text-foreground-muted">
        Verificando credenciales de plataforma...
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />;
  }

  // Verifica si el rol del JWT o de la sesión es SUPERADMIN
  const userRole = (session.user as unknown as { role?: string })?.role;
  if (userRole !== "SUPERADMIN") {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
