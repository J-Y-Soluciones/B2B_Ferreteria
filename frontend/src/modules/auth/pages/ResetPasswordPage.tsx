// src/modules/auth/pages/ResetPasswordPage.tsx
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { httpClient } from "@/shared/api/httpClient";
import { alertService } from "@/shared/utils/alerts";
import { KeyRound, Lock } from "lucide-react";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas p-4 font-mono text-xs">
        <div className="w-full max-w-sm rounded-xl border border-rose-500/30 bg-surface p-6 shadow-2xl text-center space-y-3">
          <p className="text-rose-500 font-bold">Enlace Invalido o Caducado</p>
          <p className="text-foreground-secondary">
            No se encontró el token de seguridad. Solicite un nuevo enlace de
            recuperación.
          </p>
          <Link
            className="text-brand font-bold inline-block hover:underline"
            to="/forgot-password"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    try {
      await httpClient.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });

      alertService.success(
        "Contraseña Restablecida",
        "Su clave ha sido actualizada. Inicie sesión nuevamente.",
      );
      navigate("/login");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "El enlace ha caducado o es inválido.";
      alertService.error("Fallo al restablecer", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas p-4 font-mono text-xs">
      <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-brand">
          <KeyRound className="h-5 w-5" />
          <h1 className="text-sm font-bold text-foreground">
            Definir Nueva Contraseña
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-foreground-secondary mb-1">
              Nueva Clave
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-2.5 h-3.5 w-3.5 text-foreground-muted" />
              <input
                type="password"
                {...register("newPassword")}
                className="w-full bg-surface-elevated border border-border-strong rounded pl-8 pr-3 py-1.5 text-foreground focus:border-brand focus:outline-none"
              />
            </div>
            {errors.newPassword && (
              <span className="text-rose-500 text-[10px]">
                {errors.newPassword.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-foreground-secondary mb-1">
              Confirmar Nueva Clave
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-2.5 h-3.5 w-3.5 text-foreground-muted" />
              <input
                type="password"
                {...register("confirmPassword")}
                className="w-full bg-surface-elevated border border-border-strong rounded pl-8 pr-3 py-1.5 text-foreground focus:border-brand focus:outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-rose-500 text-[10px]">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand text-brand-fg font-bold py-2 rounded mt-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? "Actualizando..." : "Restablecer y Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
