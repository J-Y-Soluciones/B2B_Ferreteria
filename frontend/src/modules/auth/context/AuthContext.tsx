// src/modules/auth/context/AuthContext.tsx
import { useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthSession, AuthUser } from "../models/auth.types";
import { authRepository } from "../repositories/HttpAuthRepository";
import type { LoginInput } from "../schemas/auth.schemas";
import { AuthContext } from "./authContextDef";
import { httpClient } from "@/shared/api/httpClient";

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      try {
        const stored = await authRepository.getCurrentSession();
        if (stored) {
          setSession(stored);
          httpClient.defaults.headers.common.Authorization = `Bearer ${stored.accessToken}`;
          if (stored.tenant?.id) {
            httpClient.defaults.headers.common["X-Tenant-Id"] =
              stored.tenant.id;
          }
        }
      } catch {
        // En caso de error de token inválido
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (input: LoginInput) => {
    // 1. Limpiar completamente la caché previa de TanStack Query
    queryClient.clear();

    // 2. Realizar la petición de autenticación
    const newSession = await authRepository.login(input);

    // 3. Persistir sesión limpia
    localStorage.setItem("jypos_session", JSON.stringify(newSession));
    localStorage.setItem("jypos_token", newSession.accessToken);

    httpClient.defaults.headers.common.Authorization = `Bearer ${newSession.accessToken}`;

    if (newSession.tenant?.id) {
      localStorage.setItem("jypos_tenant_id", newSession.tenant.id);
      httpClient.defaults.headers.common["X-Tenant-Id"] = newSession.tenant.id;
    } else {
      localStorage.removeItem("jypos_tenant_id");
      delete httpClient.defaults.headers.common["X-Tenant-Id"];
    }

    setSession(newSession);
  };

  const logout = async () => {
    // 1. Limpieza de Axios
    delete httpClient.defaults.headers.common.Authorization;
    delete httpClient.defaults.headers.common["X-Tenant-Id"];

    // 2. Limpieza total de almacenamiento local
    localStorage.removeItem("jypos_token");
    localStorage.removeItem("jypos_tenant_id");
    localStorage.removeItem("jypos_session");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("is_impersonating");
    localStorage.removeItem("impersonated_tenant_name");
    localStorage.removeItem("superadmin_backup_token");
    localStorage.removeItem("superadmin_backup_session");

    // 3. Limpiar toda la caché en memoria de TanStack Query
    queryClient.clear();

    try {
      await authRepository.logout();
    } catch {
      // Ignorar si el token ya expiró
    } finally {
      setSession(null);
    }
  };

  const updateUserSession = (userUpdates: Partial<AuthUser>) => {
    setSession((prev) => {
      if (!prev) return null;
      const updated: AuthSession = {
        ...prev,
        user: { ...prev.user, ...userUpdates },
      };
      localStorage.setItem("jypos_session", JSON.stringify(updated));
      return updated;
    });
  };

  const setImpersonatedSession = (newSession: AuthSession) => {
    queryClient.clear();
    localStorage.setItem("jypos_session", JSON.stringify(newSession));
    localStorage.setItem("jypos_token", newSession.accessToken);
    if (newSession.tenant?.id) {
      localStorage.setItem("jypos_tenant_id", newSession.tenant.id);
      httpClient.defaults.headers.common["X-Tenant-Id"] = newSession.tenant.id;
    }
    httpClient.defaults.headers.common.Authorization = `Bearer ${newSession.accessToken}`;
    setSession(newSession);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session),
        isLoading,
        login,
        logout,
        updateUserSession,
        setImpersonatedSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
