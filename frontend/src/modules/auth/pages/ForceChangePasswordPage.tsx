// src/modules/auth/pages/ForceChangePasswordPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { httpClient } from "@/shared/api/httpClient";
import { alertService } from "@/shared/utils/alerts";
import { useAuth } from "../hooks/useAuth";
import { ShieldCheck, Lock, AlertCircle } from "lucide-react";

const forceChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ForceChangeForm = z.infer<typeof forceChangeSchema>;

export function ForceChangePasswordPage() {
  const navigate = useNavigate();
  const { session, updateUserSession, setImpersonatedSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForceChangeForm>({
    resolver: zodResolver(forceChangeSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ForceChangeForm) => {
    setApiError(null);
    setIsSubmitting(true);

    // 1. Obtener token y tenantId de la sesión o del almacenamiento
    const token = session?.accessToken || localStorage.getItem("jypos_token");
    const tenantId =
      session?.tenant?.id ||
      session?.user?.tenantId ||
      localStorage.getItem("jypos_tenant_id");

    if (!token) {
      setApiError("No se encontró una sesión activa. Vuelva a iniciar sesión.");
      setIsSubmitting(false);
      return;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (tenantId) {
      headers["X-Tenant-Id"] = tenantId;
    }

    try {
      const response = await httpClient.post<{ message: string }>(
        "/auth/change-initial-password",
        {
          newPassword: data.newPassword,
        },
        { headers },
      );

      console.log("--> Contraseña cambiada con éxito:", response.data);

      // 2. Limpiar el estado de forzar cambio
      updateUserSession({ mustChangePassword: false });
      if (session) {
        setImpersonatedSession({
          ...session,
          user: {
            ...session.user,
            mustChangePassword: false,
          },
        });
      }

      alertService.success(
        "Contraseña Actualizada",
        "Su clave definitiva se guardó correctamente. Bienvenido al sistema.",
      );

      navigate("/pos", { replace: true });
    } catch (err: unknown) {
      console.error("--> Error al cambiar contraseña:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Error al actualizar la contraseña";
      setApiError(msg);
      alertService.error("Fallo", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (formErrors: typeof errors) => {
    console.warn("--> Validación de formulario rechazada por Zod:", formErrors);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas p-4 font-mono text-xs select-none">
      <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-brand">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-sm font-bold text-foreground">
            Primer Acceso — Seguridad
          </h1>
        </div>

        <p className="text-foreground-secondary text-[11px]">
          Por políticas de protección, debe reemplazar la contraseña provisional
          asignada antes de continuar.
        </p>

        {apiError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3">
          <div>
            <label className="block text-foreground-secondary mb-1">
              Nueva Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-2.5 h-3.5 w-3.5 text-foreground-muted" />
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...register("newPassword")}
                className="w-full bg-surface-elevated border border-border-strong rounded pl-8 pr-3 py-1.5 text-foreground focus:border-brand focus:outline-none"
              />
            </div>
            {errors.newPassword && (
              <span className="text-rose-500 text-[10px] mt-1 block">
                {errors.newPassword.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-foreground-secondary mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-2.5 h-3.5 w-3.5 text-foreground-muted" />
              <input
                type="password"
                placeholder="Repita la nueva contraseña"
                {...register("confirmPassword")}
                className="w-full bg-surface-elevated border border-border-strong rounded pl-8 pr-3 py-1.5 text-foreground focus:border-brand focus:outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-rose-500 text-[10px] mt-1 block">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand text-brand-fg font-bold py-2 rounded mt-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? "Guardando..." : "Establecer y Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
