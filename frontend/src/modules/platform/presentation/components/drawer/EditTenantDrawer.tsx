// src/modules/platform/presentation/components/drawer/EditTenantDrawer.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Building2, Layers, Cpu } from "lucide-react";
import type { PlatformTenant } from "../../../domain/models/platformTenant.types";
import {
  editTenantSchema,
  type EditTenantFormInput,
} from "../../schemas/editTenant.schemas";
import { useTenantActions } from "../../../application/hooks/useTenantActions";

interface EditTenantDrawerProps {
  readonly tenant: PlatformTenant | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function EditTenantDrawer({
  tenant,
  open,
  onClose,
}: EditTenantDrawerProps) {
  const { updateTenant, isUpdatingTenant } = useTenantActions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTenantFormInput>({
    resolver: zodResolver(editTenantSchema),
  });

  useEffect(() => {
    if (tenant) {
      // Acceso defensivo con tipado seguro para cuotas y planes
      const raw = tenant as unknown as Record<string, unknown>;
      const rawPlan = (
        raw.plan && typeof raw.plan === "object" ? raw.plan : {}
      ) as Record<string, unknown>;

      const dueDay = Number(raw.dueDay ?? rawPlan.dueDay ?? 15);
      const maxCashRegisters = Number(
        raw.maxCashRegisters ??
          raw.cashRegistersCount ??
          rawPlan.maxCashRegisters ??
          1,
      );
      const maxUsers = Number(
        raw.maxUsers ?? raw.usersCount ?? rawPlan.maxUsers ?? 2,
      );
      const monthlyFee = Number(
        raw.monthlyFee ?? raw.pricePerMonth ?? rawPlan.monthlyFee ?? 119.0,
      );

      const status =
        tenant.status === "ACTIVE" ||
        tenant.status === "TRIAL" ||
        tenant.status === "SUSPENDED" ||
        tenant.status === "CANCELLED"
          ? tenant.status
          : "ACTIVE";

      // Verificación segura de allowNegativeStock sin romper el tipo TenantModules
      const modulesRaw = tenant.modules as unknown as Record<string, unknown>;
      const allowNegative = Boolean(modulesRaw?.allowNegativeStock ?? false);

      reset({
        businessName: tenant.businessName,
        tradeName: tenant.tradeName,
        profile: tenant.profile,
        plan: {
          subscriptionStatus: status,
          dueDay:
            Number.isFinite(dueDay) && dueDay >= 1 && dueDay <= 31
              ? dueDay
              : 15,
          maxCashRegisters:
            Number.isFinite(maxCashRegisters) && maxCashRegisters >= 1
              ? maxCashRegisters
              : 1,
          maxUsers: Number.isFinite(maxUsers) && maxUsers >= 1 ? maxUsers : 2,
          monthlyFee:
            Number.isFinite(monthlyFee) && monthlyFee >= 0 ? monthlyFee : 119.0,
        },
        modules: {
          moduleSunat: Boolean(tenant.modules?.sunat),
          moduleCredits: Boolean(tenant.modules?.credits),
          moduleMultiwarehouse: Boolean(tenant.modules?.multiwarehouse),
          allowNegativeStock: allowNegative,
        },
      });
    }
  }, [tenant, reset]);

  if (!open || !tenant) return null;

  const onSubmit = async (data: EditTenantFormInput) => {
    await updateTenant({ tenantId: tenant.id, data });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs font-mono text-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border-strong flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-border-strong flex items-center justify-between bg-surface-subtle">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand" />
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Editar Comercio
                </h2>
                <p className="text-[10px] text-foreground-muted">
                  {tenant.ruc} — {tenant.tradeName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-4 space-y-5"
          >
            {/* 1. Datos Generales */}
            <div className="space-y-3">
              <h3 className="font-bold text-brand uppercase text-[11px] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Identidad Comercial
              </h3>

              <div>
                <label className="block text-foreground-secondary mb-1">
                  Razón Social
                </label>
                <input
                  {...register("businessName")}
                  className="w-full bg-surface-elevated border border-border-strong rounded px-2.5 py-1.5 text-foreground focus:border-brand focus:outline-none"
                />
                {errors.businessName && (
                  <span className="text-rose-500 text-[10px]">
                    {errors.businessName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-foreground-secondary mb-1">
                  Nombre Comercial
                </label>
                <input
                  {...register("tradeName")}
                  className="w-full bg-surface-elevated border border-border-strong rounded px-2.5 py-1.5 text-foreground focus:border-brand focus:outline-none"
                />
                {errors.tradeName && (
                  <span className="text-rose-500 text-[10px]">
                    {errors.tradeName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-foreground-secondary mb-1">
                  Rubro de Comercio
                </label>
                <select
                  {...register("profile")}
                  className="w-full bg-surface-elevated border border-border-strong rounded px-2.5 py-1.5 text-foreground focus:border-brand focus:outline-none"
                >
                  <option value="HARDWARE_STORE">
                    Ferretería / Materiales
                  </option>
                  <option value="LUBRICENTER">Lubricentro / Taller</option>
                </select>
              </div>
            </div>

            {/* 2. Planes y Facturación */}
            <div className="space-y-3 pt-3 border-t border-border-subtle">
              <h3 className="font-bold text-brand uppercase text-[11px] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Plan y Cuotas
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-foreground-secondary mb-1">
                    Estado Servicio
                  </label>
                  <select
                    {...register("plan.subscriptionStatus")}
                    className="w-full bg-surface-elevated border border-border-strong rounded px-2 py-1.5 text-foreground focus:border-brand focus:outline-none"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="TRIAL">Prueba (Trial)</option>
                    <option value="SUSPENDED">Suspendido</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground-secondary mb-1">
                    Día de Corte
                  </label>
                  <input
                    type="number"
                    {...register("plan.dueDay", { valueAsNumber: true })}
                    className="w-full bg-surface-elevated border border-border-strong rounded px-2 py-1.5 text-foreground focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-foreground-secondary mb-1">
                    Cajas POS
                  </label>
                  <input
                    type="number"
                    {...register("plan.maxCashRegisters", {
                      valueAsNumber: true,
                    })}
                    className="w-full bg-surface-elevated border border-border-strong rounded px-2 py-1.5 text-foreground focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-foreground-secondary mb-1">
                    Usuarios
                  </label>
                  <input
                    type="number"
                    {...register("plan.maxUsers", { valueAsNumber: true })}
                    className="w-full bg-surface-elevated border border-border-strong rounded px-2 py-1.5 text-foreground focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-foreground-secondary mb-1">
                    Tarifa (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("plan.monthlyFee", { valueAsNumber: true })}
                    className="w-full bg-surface-elevated border border-border-strong rounded px-2 py-1.5 text-foreground focus:border-brand focus:outline-none font-bold text-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Módulos / Add-ons */}
            <div className="space-y-3 pt-3 border-t border-border-subtle">
              <h3 className="font-bold text-brand uppercase text-[11px] flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Módulos y Add-ons
              </h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded border border-border-strong bg-surface-elevated/50 hover:bg-surface-elevated cursor-pointer">
                  <span className="text-foreground">
                    Facturación Electrónica SUNAT (+S/ 90)
                  </span>
                  <input
                    type="checkbox"
                    {...register("modules.moduleSunat")}
                    className="h-4 w-4 rounded accent-brand"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-border-strong bg-surface-elevated/50 hover:bg-surface-elevated cursor-pointer">
                  <span className="text-foreground">
                    Cuentas por Cobrar / Fiados (+S/ 60)
                  </span>
                  <input
                    type="checkbox"
                    {...register("modules.moduleCredits")}
                    className="h-4 w-4 rounded accent-brand"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-border-strong bg-surface-elevated/50 hover:bg-surface-elevated cursor-pointer">
                  <span className="text-foreground">
                    Multi-Almacén y Stock (+S/ 80)
                  </span>
                  <input
                    type="checkbox"
                    {...register("modules.moduleMultiwarehouse")}
                    className="h-4 w-4 rounded accent-brand"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-border-strong bg-surface-elevated/50 hover:bg-surface-elevated cursor-pointer">
                  <span className="text-foreground">
                    Permitir Stock Negativo
                  </span>
                  <input
                    type="checkbox"
                    {...register("modules.allowNegativeStock")}
                    className="h-4 w-4 rounded accent-brand"
                  />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-border-strong flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-border-strong text-foreground-secondary hover:bg-surface-elevated"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdatingTenant}
                className="flex items-center gap-1.5 bg-brand text-brand-fg font-bold px-3 py-1.5 rounded shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>
                  {isUpdatingTenant ? "Guardando..." : "Guardar Cambios"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
