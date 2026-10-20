// src/modules/platform/presentation/components/table/TenantManagementTable.tsx
import { useState, useRef, useEffect } from "react";
import type { PlatformTenant } from "../../../domain/models/platformTenant.types";
import {
  Zap,
  RotateCcw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  Sliders,
  CalendarPlus,
} from "lucide-react";

interface TenantManagementTableProps {
  readonly tenants: PlatformTenant[];
  readonly onImpersonate: (tenantId: string) => Promise<void>;
  readonly onToggleStatus: (tenant: PlatformTenant) => Promise<void>;
  readonly onRenewSubscription?: (tenant: PlatformTenant) => Promise<void>;
  readonly onEditTenant?: (tenant: PlatformTenant) => void;
  readonly onDeleteTenant?: (tenant: PlatformTenant) => Promise<void>;
  readonly isImpersonating: boolean;
}

export function TenantManagementTable({
  tenants,
  onImpersonate,
  onToggleStatus,
  onRenewSubscription,
  onEditTenant,
  onDeleteTenant,
  isImpersonating,
}: TenantManagementTableProps) {
  const [activeMenuTenantId, setActiveMenuTenantId] = useState<string | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTenantId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPen = (val: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(val);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const calculateDaysRemaining = (isoString: string) => {
    try {
      const diffMs = new Date(isoString).getTime() - new Date().getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const getProfileLabel = (profile: string) => {
    switch (profile) {
      case "LUBRICENTER":
        return "Lubricentro";
      case "HARDWARE_STORE":
        return "Ferretería";
      default:
        return profile;
    }
  };

  const getStatusLabel = (status: string, trialDays?: number) => {
    switch (status) {
      case "ACTIVE":
        return "Activo";
      case "TRIAL":
        return `Prueba (${trialDays ?? 14}d)`;
      case "SUSPENDED":
        return "Suspendido";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (tenants.length === 0) {
    return (
      <div className="rounded-xl border border-border-strong bg-surface p-12 text-center font-mono">
        <p className="text-sm text-foreground-muted">
          No se encontraron comercios que coincidan con los filtros
          seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-strong bg-surface shadow-elevation font-mono text-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-strong bg-surface-subtle text-[10px] uppercase text-foreground-secondary tracking-wider">
              <th className="p-3 font-bold first:rounded-tl-xl">
                RUC / Razón Social
              </th>
              <th className="p-3 font-bold text-center">Rubro</th>
              <th className="p-3 font-bold text-center">Estado / Plan</th>
              <th className="p-3 font-bold text-center">Fecha de Corte</th>
              <th className="p-3 font-bold">Módulos Activos</th>
              <th className="p-3 font-bold text-center">
                Cuotas (Cajas / Usr)
              </th>
              <th className="p-3 font-bold text-right">Tarifa Mensual</th>
              <th className="p-3 font-bold text-center min-w-[140px] last:rounded-tr-xl">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {tenants.map((tenant, index) => {
              const daysLeft = calculateDaysRemaining(tenant.expiresAt);
              const isSuspended = tenant.status === "SUSPENDED";
              const isTrial = tenant.status === "TRIAL";
              const isActive = tenant.status === "ACTIVE";
              const isMenuOpen = activeMenuTenantId === tenant.id;
              const isLastRow = index === tenants.length - 1;

              const initials = tenant.tradeName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const registersPercent = Math.min(
                100,
                (tenant.quotas.currentRegisters / tenant.quotas.maxRegisters) *
                  100,
              );

              return (
                <tr
                  key={tenant.id}
                  className={`transition-colors border-b border-border-subtle ${
                    isSuspended
                      ? "bg-rose-500/5 hover:bg-rose-500/10"
                      : isTrial
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-surface-elevated/40"
                  }`}
                >
                  {/* RUC / Razón Social */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          isSuspended
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : isTrial
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-brand/20 text-brand border border-brand/30"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground truncate max-w-[220px]">
                            {tenant.tradeName}
                          </span>
                          {isSuspended && (
                            <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-400 border border-rose-500/30">
                              CORTE AUTOMÁTICO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-foreground-muted flex items-center gap-2 mt-0.5">
                          <span>RUC: {tenant.ruc}</span>
                          <span>•</span>
                          <span className="truncate max-w-[160px]">
                            {tenant.adminEmail}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rubro */}
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${
                        tenant.profile === "LUBRICENTER"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {getProfileLabel(tenant.profile)}
                    </span>
                  </td>

                  {/* Estado / Plan */}
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border ${
                          isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : isTrial
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {getStatusLabel(
                          tenant.status,
                          tenant.trialDaysRemaining,
                        )}
                      </span>
                      <span className="text-[9px] text-foreground-muted mt-0.5">
                        {tenant.planName === "BASIC"
                          ? "Plan Base (S/ 119/m)"
                          : tenant.planName === "PRO"
                            ? "Full Pack (S/ 349/m)"
                            : "Enterprise"}
                      </span>
                    </div>
                  </td>

                  {/* Fecha de corte Inteligente */}
                  <td className="p-3 text-center">
                    <div className="font-semibold text-foreground text-[11px]">
                      {formatDate(tenant.expiresAt)}
                    </div>
                    <div className="text-[9px] mt-0.5">
                      {isSuspended ? (
                        <span className="text-rose-400 font-bold">
                          Vencido hace{" "}
                          {tenant.daysOverdue ?? Math.abs(daysLeft)} días
                        </span>
                      ) : isTrial ? (
                        <span className="text-amber-400 font-bold">
                          {daysLeft <= 3
                            ? `⚠️ Prueba finaliza en ${daysLeft}d`
                            : `Prueba: ${daysLeft} días rest.`}
                        </span>
                      ) : daysLeft <= 3 ? (
                        <span className="text-amber-400 font-bold">
                          ⚠️ Cobro en {daysLeft} días
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          En {daysLeft} días
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Módulos */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[210px]">
                      {tenant.modules.sunat && (
                        <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                          SUNAT +S/90
                        </span>
                      )}
                      {tenant.modules.credits && (
                        <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                          FIADOS +S/60
                        </span>
                      )}
                      {tenant.modules.multiwarehouse && (
                        <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                          MULTI-STOCK +S/80
                        </span>
                      )}
                      {!tenant.modules.sunat &&
                        !tenant.modules.credits &&
                        !tenant.modules.multiwarehouse && (
                          <span className="text-foreground-muted text-[10px]">
                            Solo Plan Base
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Cuotas */}
                  <td className="p-3 text-center">
                    <div className="inline-flex flex-col items-center min-w-[85px]">
                      <div className="flex justify-between w-full text-[10px] text-foreground-secondary mb-0.5">
                        <span>
                          Cajas:{" "}
                          <strong className="text-foreground">
                            {tenant.quotas.currentRegisters}/
                            {tenant.quotas.maxRegisters}
                          </strong>
                        </span>
                        <span className="ml-2">
                          Usr:{" "}
                          <strong className="text-foreground">
                            {tenant.quotas.currentUsers}/
                            {tenant.quotas.maxUsers}
                          </strong>
                        </span>
                      </div>
                      <div className="w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            registersPercent >= 100
                              ? "bg-rose-500"
                              : registersPercent >= 75
                                ? "bg-amber-500"
                                : "bg-brand"
                          }`}
                          style={{ width: `${registersPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Tarifa */}
                  <td className="p-3 text-right">
                    <div className="font-black text-foreground text-[11px]">
                      {formatPen(tenant.monthlyFeePen)}
                    </div>
                    <div className="text-[9px] text-foreground-muted">
                      {isTrial
                        ? "Periodo de prueba"
                        : isSuspended
                          ? "Deuda en cobranza"
                          : "mensual pactado"}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="p-3 text-center relative">
                    <div className="flex items-center justify-center gap-1.5">
                      {isSuspended ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(tenant)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                          title="Reactivar servicio"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isImpersonating}
                          onClick={() => onImpersonate(tenant.id)}
                          className="inline-flex items-center gap-1 rounded bg-brand/10 border border-brand/30 px-2.5 py-1 text-[10px] font-bold text-brand hover:bg-brand hover:text-brand-fg transition-all active:scale-95 disabled:opacity-50"
                          title="Entrar al terminal POS de este comercio"
                        >
                          <Zap className="h-3 w-3 fill-current" />
                          Impersonar
                        </button>
                      )}

                      {/* Dropdown 3 Puntos */}
                      <div
                        className="relative inline-block text-left"
                        ref={isMenuOpen ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuTenantId(
                              isMenuOpen ? null : tenant.id,
                            );
                          }}
                          className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
                          title="Más opciones"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className={`absolute right-0 z-50 w-48 rounded-lg border border-border-strong bg-surface p-1 shadow-2xl font-mono text-[11px] animate-in fade-in duration-150 ${
                              isLastRow
                                ? "bottom-full mb-1 origin-bottom-right"
                                : "top-full mt-1 origin-top-right"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onImpersonate(tenant.id);
                                setActiveMenuTenantId(null);
                              }}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-foreground hover:bg-surface-elevated text-left"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-brand" />
                              <span>Auditar Terminal POS</span>
                            </button>

                            {/* 👇 BOTÓN RENOVAR 1 MES (+30 DÍAS) */}
                            {onRenewSubscription && (
                              <button
                                type="button"
                                onClick={() => {
                                  void onRenewSubscription(tenant);
                                  setActiveMenuTenantId(null);
                                }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-emerald-400 hover:bg-emerald-500/10 text-left font-bold"
                              >
                                <CalendarPlus className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Registrar Pago (+30d)</span>
                              </button>
                            )}

                            {onEditTenant && (
                              <button
                                type="button"
                                onClick={() => {
                                  onEditTenant(tenant);
                                  setActiveMenuTenantId(null);
                                }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-foreground hover:bg-surface-elevated text-left"
                              >
                                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                                <span>Configurar Módulos</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                void onToggleStatus(tenant);
                                setActiveMenuTenantId(null);
                              }}
                              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-left ${
                                isSuspended
                                  ? "text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-rose-400 hover:bg-rose-500/10"
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Reactivar Servicio</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Suspender Servicio</span>
                                </>
                              )}
                            </button>

                            {onDeleteTenant && (
                              <>
                                <div className="my-1 border-t border-border-subtle" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    void onDeleteTenant(tenant);
                                    setActiveMenuTenantId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Eliminar Comercio</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
