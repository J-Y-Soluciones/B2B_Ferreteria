// src/modules/team/components/ResetUserPasswordModal.tsx
import { useState } from "react";
import { KeyRound, ShieldAlert, X } from "lucide-react";
import Swal from "sweetalert2";
import type { TenantUser } from "../models/team.types";

interface ResetUserPasswordModalProps {
  readonly user: TenantUser | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (
    temporaryPassword?: string,
  ) => Promise<string | undefined>;
  readonly isSubmitting: boolean;
}

export function ResetUserPasswordModal({
  user,
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: ResetUserPasswordModalProps) {
  const [customPassword, setCustomPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (customPassword.trim() && customPassword.trim().length < 8) {
      setError(
        "La contraseña provisional manual debe tener mínimo 8 caracteres.",
      );
      return;
    }

    try {
      const generatedPass = await onConfirm(
        customPassword.trim() ? customPassword.trim() : undefined,
      );

      onClose();
      setCustomPassword("");

      // Alerta para mostrar la clave al administrador y que pueda copiarla al mostrador
      if (generatedPass) {
        await Swal.fire({
          icon: "info",
          title: "Clave Provisional Asignada",
          html: `
            <div class="text-left font-mono text-xs space-y-2 mt-2">
              <p class="text-slate-300">Entrega esta clave al operador para su ingreso:</p>
              <div class="p-3 bg-slate-900 border border-amber-500/40 rounded text-amber-400 font-bold text-base text-center select-all">
                ${generatedPass}
              </div>
              <p class="text-[11px] text-slate-400">
                ⚠️ Al ingresar al POS, el sistema le exigirá crear su contraseña definitiva de inmediato.
              </p>
            </div>
          `,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#f59e0b",
          background: "#0f172a",
          color: "#f8fafc",
          customClass: {
            popup:
              "border border-amber-500/30 rounded-2xl font-mono text-xs shadow-2xl",
          },
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al restablecer contraseña";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2 text-brand">
            <KeyRound className="h-4 w-4" />
            <h2 className="text-sm font-bold text-foreground">
              Blanqueo de Clave en Mostrador
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5 text-amber-300 space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>
              Operador: {user.fullName} ({user.role})
            </span>
          </div>
          <p className="text-foreground-secondary">
            Esta acción invalidará cualquier sesión abierta del operador y le
            obligará a crear una clave nueva en su próximo login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-foreground-secondary mb-1">
              Contraseña Provisional (Opcional)
            </label>
            <input
              type="text"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="Dejar vacío para autogenerar (ej. Jy7#kL9p2X)"
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none"
            />
            {error && <p className="text-rose-500 text-[10px] mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded border border-border-strong text-foreground-secondary hover:bg-surface-elevated"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded bg-brand text-brand-fg font-bold hover:bg-brand-hover active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Restableciendo..." : "Asignar Clave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
