// src/modules/platform/presentation/components/header/PlatformGlobalHeader.tsx
import { Zap, LogOut, Sun, Moon } from "lucide-react";
import type { PlatformSystemTelemetry } from "../../../domain/models/platformMetrics.types";
import { useTheme } from "@/shared/hooks/useTheme";

interface PlatformGlobalHeaderProps {
  readonly telemetry?: PlatformSystemTelemetry;
  readonly adminHandle?: string;
  readonly onLogout?: () => void;
}

export function PlatformGlobalHeader({
  telemetry,
  adminHandle = "@admin_jy",
  onLogout,
}: PlatformGlobalHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border-strong bg-surface px-4 flex items-center justify-between select-none font-mono text-xs">
      {/* Brand & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand/20 border border-brand flex items-center justify-center text-brand">
            <Zap className="h-4 w-4 fill-brand" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">
              JY Soluciones Tech
            </h1>
            <span className="text-[9px] text-brand uppercase font-bold tracking-widest">
              Platform Superadmin
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            • Prod v1.2
          </span>
          <span className="text-foreground-muted text-[10px]">Staging</span>
        </div>
      </div>

      {/* Telemetría Técnica Central */}
      <div className="hidden lg:flex items-center gap-4 text-[11px] text-foreground-secondary">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground-muted">SUNAT / PSE:</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {telemetry?.sunatStatus ?? "ONLINE"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-foreground-muted">Redis Token-Bucket:</span>
          <span className="text-foreground font-bold">
            {telemetry?.redisLatencyMs ?? 0}ms latency
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-foreground-muted">Database Replica:</span>
          <span className="text-foreground font-bold">
            Lag: {telemetry?.databaseReplicaLagSec ?? 0}s
          </span>
        </div>
      </div>

      {/* Perfil, Tema & Acciones */}
      <div className="flex items-center gap-2.5">
        {/* Botón de cambio de tema Claro / Oscuro */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center p-1.5 rounded-lg border border-border-strong bg-surface-elevated text-foreground-secondary hover:text-foreground transition-colors"
          title={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-elevated px-2.5 py-1">
          <div className="h-6 w-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px] font-bold">
            JY
          </div>
          <div className="text-left leading-none">
            <div className="text-[11px] font-bold text-foreground">
              {adminHandle}
            </div>
            <div className="text-[9px] text-foreground-muted">Super Root</div>
          </div>
        </div>

        {/* Botón de Salir */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg border border-border-strong px-2.5 py-1.5 text-[11px] text-foreground-secondary hover:bg-surface-elevated hover:text-rose-400 transition-colors"
          title="Cerrar Sesión Global"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
