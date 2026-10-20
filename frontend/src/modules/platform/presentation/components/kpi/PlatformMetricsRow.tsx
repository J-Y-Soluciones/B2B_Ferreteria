// src/modules/platform/presentation/components/kpi/PlatformMetricsRow.tsx
import type { PlatformMetrics } from "../../../domain/models/platformMetrics.types";
import { TrendingUp } from "lucide-react";

interface PlatformMetricsRowProps {
  readonly metrics: PlatformMetrics;
}

export function PlatformMetricsRow({ metrics }: PlatformMetricsRowProps) {
  const formatPen = (val: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
      {/* 1. MRR PLATAFORMA */}
      <div className="rounded-xl border border-border-strong bg-surface p-3.5 flex flex-col justify-between shadow-elevation">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground-secondary tracking-wider text-[11px] uppercase">
            MRR Plataforma
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-2.5 w-2.5" />+
            {metrics.mrr.monthOverMonthGrowthPct}% mes
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-foreground tracking-tight">
            {formatPen(metrics.mrr.currentMonthPen)}
          </div>
          <p className="text-[10px] text-foreground-muted mt-0.5">
            ARR Proyectado: {formatPen(metrics.mrr.arrProjectedPen)}
          </p>
        </div>
      </div>

      {/* 2. COMERCIOS ACTIVOS */}
      <div className="rounded-xl border border-border-strong bg-surface p-3.5 flex flex-col justify-between shadow-elevation">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground-secondary tracking-wider text-[11px] uppercase">
            Comercios Activos
          </span>
          <span className="inline-flex items-center rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand border border-brand/20">
            Churn: {metrics.tenantsCount.churnRatePct}%
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-foreground flex items-baseline gap-1.5">
            <span>{metrics.tenantsCount.active}</span>
            <span className="text-xs text-foreground-muted font-normal">
              / {metrics.tenantsCount.total} Tenants
            </span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            {metrics.tenantsCount.healthPercentage}% Salud • Ticket Prom: S/{" "}
            {metrics.tenantsCount.averageTicketPen}
          </p>
        </div>
      </div>

      {/* 3. COMERCIOS EN TRIAL */}
      <div className="rounded-xl border border-border-strong bg-surface p-3.5 flex flex-col justify-between shadow-elevation">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground-secondary tracking-wider text-[11px] uppercase">
            Comercios en Trial
          </span>
          {metrics.trialTenants.expiringWithin7Days > 0 && (
            <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
              Expira &lt; 7d
            </span>
          )}
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-amber-400">
            {metrics.trialTenants.count} Tiendas
          </div>
          <p className="text-[10px] text-foreground-muted mt-0.5">
            Conversión estimada: {metrics.trialTenants.estimatedConversionPct}%
          </p>
        </div>
      </div>

      {/* 4. EN RIESGO / CORTE */}
      <div className="rounded-xl border border-border-strong bg-surface p-3.5 flex flex-col justify-between shadow-elevation">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground-secondary tracking-wider text-[11px] uppercase">
            En Riesgo / Corte
          </span>
          {metrics.atRiskTenants.suspendedCount > 0 && (
            <span className="inline-flex items-center rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
              Acción Req.
            </span>
          )}
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-rose-500">
            {metrics.atRiskTenants.suspendedCount} Suspendido
          </div>
          <p className="text-[10px] text-foreground-muted mt-0.5 truncate">
            {metrics.atRiskTenants.criticalTenantRuc ? (
              <>
                RUC {metrics.atRiskTenants.criticalTenantRuc} (
                {metrics.atRiskTenants.criticalDaysOverdue}d mora)
              </>
            ) : (
              "Sin mora activa"
            )}
          </p>
        </div>
      </div>

      {/* 5. RECURSOS GLOBALES */}
      <div className="rounded-xl border border-border-strong bg-surface p-3.5 flex flex-col justify-between shadow-elevation">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground-secondary tracking-wider text-[11px] uppercase">
            Recursos Globales
          </span>
          <span className="text-[10px] text-foreground-muted font-normal">
            Load: {metrics.telemetry.globalLoadPercentage}%
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <div className="text-base font-black text-foreground">
              {metrics.globalResources.totalPosRegisters} Cajas POS
            </div>
            <p className="text-[10px] text-emerald-400">
              {metrics.globalResources.requestsPerMinute} req/min
            </p>
          </div>
          <div className="text-right border-l border-border-subtle pl-2">
            <div className="text-base font-black text-foreground">
              {metrics.globalResources.totalUsers} Usuarios
            </div>
            <p className="text-[10px] text-foreground-muted">
              P99: {metrics.telemetry.globalP99LatencyMs}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
