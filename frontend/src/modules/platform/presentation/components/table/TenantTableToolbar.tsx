// src/modules/platform/presentation/components/table/TenantTableToolbar.tsx
import { Search, Plus } from "lucide-react";
import type {
  SubscriptionStatus,
  TenantBusinessProfile,
} from "../../../domain/models/platformTenant.types";

interface TenantTableToolbarProps {
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly currentStatus: SubscriptionStatus | "ALL";
  readonly onStatusChange: (status: SubscriptionStatus | "ALL") => void;
  readonly currentProfile: TenantBusinessProfile | "ALL";
  readonly onProfileChange: (profile: TenantBusinessProfile | "ALL") => void;
  readonly activeModuleFilter?: "sunat" | "credits" | "multiwarehouse";
  readonly onModuleFilterChange: (
    mod?: "sunat" | "credits" | "multiwarehouse",
  ) => void;
  readonly statusCounts: {
    readonly all: number;
    readonly active: number;
    readonly trial: number;
    readonly suspended: number;
  };
  readonly onOpenOnboarding: () => void;
}

export function TenantTableToolbar({
  searchTerm,
  onSearchChange,
  currentStatus,
  onStatusChange,
  currentProfile,
  onProfileChange,
  activeModuleFilter,
  onModuleFilterChange,
  statusCounts,
  onOpenOnboarding,
}: TenantTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center gap-2">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por RUC, Nombre o Email..."
            className="h-8.5 w-60 rounded-lg border border-border-strong bg-surface py-1 pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Pestañas de Estado con Contadores Globales */}
        <div className="flex items-center rounded-lg border border-border-strong bg-surface p-0.5">
          <button
            type="button"
            onClick={() => onStatusChange("ALL")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold transition-colors ${
              currentStatus === "ALL"
                ? "bg-surface-elevated text-foreground"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span>Todos</span>
            <span className="rounded bg-brand/20 px-1 text-[10px] text-brand">
              {statusCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("ACTIVE")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold transition-colors ${
              currentStatus === "ACTIVE"
                ? "bg-surface-elevated text-emerald-400"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span>Activos</span>
            <span className="rounded bg-emerald-500/10 px-1 text-[10px] text-emerald-400">
              {statusCounts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("TRIAL")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold transition-colors ${
              currentStatus === "TRIAL"
                ? "bg-surface-elevated text-amber-400"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span>Prueba</span>
            <span className="rounded bg-amber-500/10 px-1 text-[10px] text-amber-400">
              {statusCounts.trial}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange("SUSPENDED")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold transition-colors ${
              currentStatus === "SUSPENDED"
                ? "bg-surface-elevated text-rose-400"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span>Suspendidos</span>
            <span className="rounded bg-rose-500/10 px-1 text-[10px] text-rose-400">
              {statusCounts.suspended}
            </span>
          </button>
        </div>

        {/* Selector de Rubro con valores exactos del Domain Model */}
        <select
          value={currentProfile}
          onChange={(e) =>
            onProfileChange(e.target.value as TenantBusinessProfile | "ALL")
          }
          aria-label="Filtrar por rubro comercial"
          className="h-8.5 rounded-lg border border-border-strong bg-surface px-2.5 py-1 text-xs text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
        >
          <option value="ALL">Rubro: Todos</option>
          <option value="HARDWARE_STORE">Ferreterías</option>
          <option value="LUBRICENTER">Lubricentros</option>
        </select>

        {/* Filtros de Módulos */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] text-foreground-secondary">
          <span className="mr-1 text-foreground-muted">Módulos:</span>
          {(["sunat", "credits", "multiwarehouse"] as const).map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() =>
                onModuleFilterChange(
                  activeModuleFilter === mod ? undefined : mod,
                )
              }
              className={`rounded border px-2 py-0.5 font-bold transition-all ${
                activeModuleFilter === mod
                  ? "border-brand bg-brand/20 text-brand"
                  : "border-border-strong bg-surface text-foreground-secondary hover:text-foreground"
              }`}
            >
              {mod === "sunat"
                ? "SUNAT"
                : mod === "credits"
                  ? "Fiados"
                  : "Multi-Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Botón Onboarding */}
      <button
        type="button"
        onClick={onOpenOnboarding}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-brand-fg shadow hover:bg-brand-hover transition-all active:scale-95"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Nuevo Comercio (Onboarding Rápido)</span>
        <kbd className="ml-1 rounded bg-black/20 px-1 text-[9px]">F9</kbd>
      </button>
    </div>
  );
}
