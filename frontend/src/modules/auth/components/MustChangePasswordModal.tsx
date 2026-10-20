// src/modules/auth/components/MustChangePasswordModal.tsx
import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { httpClient } from "@/shared/api/httpClient";
import { alertService } from "@/shared/utils/alerts";

interface MustChangePasswordModalProps {
  readonly open: boolean;
  readonly onSuccess: () => void;
}

export function MustChangePasswordModal({
  open,
  onSuccess,
}: MustChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setIsSubmitting(true);
      await httpClient.post("/auth/change-initial-password", {
        currentPassword,
        newPassword,
      });

      alertService.success(
        "Contraseña Actualizada",
        "Tu cuenta ha sido asegurada. Ya puedes acceder al sistema.",
      );
      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al actualizar la contraseña",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-surface p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-sm font-bold text-foreground">
            Actualización de Seguridad Requerida
          </h2>
          <p className="mt-1 text-[11px] text-foreground-secondary">
            Has ingresado con una contraseña temporal. Por seguridad, debes
            establecer tu contraseña personal antes de continuar.
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[10px] text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-foreground-secondary mb-1">
              Contraseña Temporal Actual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-border-strong bg-surface-elevated p-2 text-xs text-foreground focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-foreground-secondary mb-1">
              Nueva Contraseña (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva clave personal"
                className="w-full rounded-lg border border-border-strong bg-surface-elevated p-2 pr-8 text-xs text-foreground focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-2.5 text-foreground-muted hover:text-foreground"
              >
                {showPass ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-foreground-secondary mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type={showPass ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva clave"
              className="w-full rounded-lg border border-border-strong bg-surface-elevated p-2 text-xs text-foreground focus:border-brand focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-xs font-bold text-brand-fg shadow hover:bg-brand-hover active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>
              {isSubmitting ? "Guardando..." : "Establecer y Acceder"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
