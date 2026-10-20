// src/shared/components/layout/ImpersonationBanner.tsx
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function ImpersonationBanner() {
  const isImpersonating = localStorage.getItem("is_impersonating") === "true";
  const tenantName =
    localStorage.getItem("impersonated_tenant_name") ?? "Comercio";

  if (!isImpersonating) return null;

  const handleExitAudit = () => {
    // 1. Restaurar sesión original de Superadmin
    const backupToken = localStorage.getItem("superadmin_backup_token");
    const backupSession = localStorage.getItem("superadmin_backup_session");

    if (backupToken) {
      localStorage.setItem("jypos_token", backupToken);
      localStorage.setItem("auth_token", backupToken);
    }
    if (backupSession) {
      localStorage.setItem("jypos_session", backupSession);
    }

    // 2. Eliminar el tenant del comercio
    localStorage.removeItem("jypos_tenant_id");
    localStorage.removeItem("tenant_id");

    // 3. Limpiar marcas de auditoría
    localStorage.removeItem("superadmin_backup_token");
    localStorage.removeItem("superadmin_backup_session");
    localStorage.removeItem("is_impersonating");
    localStorage.removeItem("impersonated_tenant_name");

    // 4. Volver a la plataforma
    window.location.href = "/platform";
  };

  return (
    <div className="h-8 bg-amber-500 text-slate-950 font-mono text-xs px-4 flex items-center justify-between font-bold shadow-md select-none shrink-0 z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        <span>
          MODO AUDITORÍA ACTIVO: Operando como Administrador en "{tenantName}"
        </span>
      </div>
      <button
        type="button"
        onClick={handleExitAudit}
        className="inline-flex items-center gap-1.5 bg-slate-950 text-white px-2.5 py-0.5 rounded text-[11px] hover:bg-slate-800 transition-colors shadow-xs active:scale-95"
      >
        <ArrowLeft className="h-3 w-3" />
        <span>Salir y Volver a Superadmin</span>
      </button>
    </div>
  );
}
