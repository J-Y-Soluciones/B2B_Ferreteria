// src/modules/platform/presentation/components/modal/EditTenantModal.tsx
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Building2,
  Zap,
  CheckCircle2,
  Loader2,
  Sliders,
} from "lucide-react";
import {
  editTenantSchema,
  type EditTenantFormInput,
} from "../../schemas/editTenant.schemas";
import type { PlatformTenant } from "../../../domain/models/platformTenant.types";

interface EditTenantModalProps {
  readonly tenant: PlatformTenant | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSave: (
    tenantId: string,
    data: EditTenantFormInput,
  ) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function EditTenantModal({
  tenant,
  open,
  onClose,
  onSave,
  isSubmitting,
}: EditTenantModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditTenantFormInput>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      businessName: "",
      tradeName: "",
      profile: "LUBRICENTER",
      plan: {
        subscriptionStatus: "TRIAL",
        dueDay: 1,
        maxCashRegisters: 1,
        maxUsers: 2,
        monthlyFee: 119,
      },
      modules: {
        moduleSunat: false,
        moduleCredits: true,
        moduleMultiwarehouse: false,
        allowNegativeStock: false,
      },
    },
  });

  useEffect(() => {
    if (tenant && open) {
      reset({
        businessName: tenant.businessName,
        tradeName: tenant.tradeName,
        profile: tenant.profile,
        plan: {
          subscriptionStatus: tenant.status,
          dueDay: new Date(tenant.expiresAt).getDate() || 1,
          maxCashRegisters: tenant.quotas.maxRegisters,
          maxUsers: tenant.quotas.maxUsers,
          monthlyFee: tenant.monthlyFeePen,
        },
        modules: {
          moduleSunat: tenant.modules.sunat,
          moduleCredits: tenant.modules.credits,
          moduleMultiwarehouse: tenant.modules.multiwarehouse,
          allowNegativeStock: tenant.modules.allowNegativeStock,
        },
      });
    }
  }, [tenant, open, reset]);

  const watchedModules = useWatch({ control, name: "modules" });

  const calculatedFee = useMemo(() => {
    let fee = 119;
    if (watchedModules?.moduleSunat) fee += 90;
    if (watchedModules?.moduleCredits) fee += 60;
    if (watchedModules?.moduleMultiwarehouse) fee += 80;
    return fee;
  }, [
    watchedModules?.moduleSunat,
    watchedModules?.moduleCredits,
    watchedModules?.moduleMultiwarehouse,
  ]);

  useEffect(() => {
    setValue("plan.monthlyFee", calculatedFee);
  }, [calculatedFee, setValue]);

  if (!open || !tenant) return null;

  const onSubmit = async (data: EditTenantFormInput) => {
    await onSave(tenant.id, data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono text-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border-strong bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-border-strong px-5 flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-brand/20 border border-brand flex items-center justify-center text-brand">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">
                Configurar Comercio & Módulos
              </h2>
              <span className="text-[10px] text-foreground-muted">
                {tenant.tradeName} (RUC: {tenant.ruc})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {/* Identidad */}
          <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-subtle/40 p-3.5">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px] border-b border-border-subtle pb-2">
              <Building2 className="h-3.5 w-3.5 text-brand" />
              DATOS GENERALES
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-foreground-secondary mb-1">
                  Nombre Comercial (POS / Tickets)
                </label>
                <input
                  type="text"
                  {...register("tradeName")}
                  className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:border-brand focus:outline-none"
                />
                {errors.tradeName && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {errors.tradeName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-foreground-secondary mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  {...register("businessName")}
                  className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:border-brand focus:outline-none"
                />
                {errors.businessName && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {errors.businessName.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Módulos Activos (Add-ons) */}
          <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-subtle/40 p-3.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                <Zap className="h-3.5 w-3.5 text-brand" />
                MÓDULOS ACTIVOS (ADD-ONS)
              </span>
              <span className="text-[10px] font-black text-amber-400">
                S/ {calculatedFee.toFixed(2)} / mes
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("modules.moduleMultiwarehouse")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Multi-Almacén & Guías de Remisión
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Múltiples depósitos, traslados internos y guías GRE.
                    </p>
                  </div>
                </div>
                <span className="font-bold text-amber-400 text-[11px]">
                  + S/ 80.00
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("modules.moduleSunat")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Facturación Electrónica SUNAT (PSE)
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Facturas, Boletas, CDR y Firma Digital SHA-256.
                    </p>
                  </div>
                </div>
                <span className="font-bold text-amber-400 text-[11px]">
                  + S/ 90.00
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("modules.moduleCredits")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Cuentas por Cobrar & Fiados (Crédito B2B)
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Líneas de crédito, amortización y alertas de mora.
                    </p>
                  </div>
                </div>
                <span className="font-bold text-amber-400 text-[11px]">
                  + S/ 60.00
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("modules.allowNegativeStock")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Permitir Venta con Stock Negativo
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Despachos en mostrador sin registro previo de guía.
                    </p>
                  </div>
                </div>
                <span className="font-bold text-emerald-400 text-[10px]">
                  Gratis
                </span>
              </label>
            </div>
          </div>

          {/* Cuotas de Cajas y Usuarios */}
          <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-subtle/40 p-3.5">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px] border-b border-border-subtle pb-2">
              CUOTAS OPERATIVAS & SUSCRIPCIÓN
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-foreground-secondary mb-1">
                  Estado
                </label>
                <select
                  {...register("plan.subscriptionStatus")}
                  className="w-full rounded border border-border-strong bg-surface py-1.5 px-2 text-xs text-foreground focus:border-brand focus:outline-none"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="TRIAL">Prueba</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-foreground-secondary mb-1">
                  Límite Cajas POS
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("plan.maxCashRegisters", {
                    valueAsNumber: true,
                  })}
                  className="w-full rounded border border-border-strong bg-surface py-1.5 px-2 text-xs text-foreground focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-foreground-secondary mb-1">
                  Límite Usuarios
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("plan.maxUsers", { valueAsNumber: true })}
                  className="w-full rounded border border-border-strong bg-surface py-1.5 px-2 text-xs text-foreground focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-strong">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-strong px-4 py-2 text-xs font-bold text-foreground-secondary hover:bg-surface-elevated"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-brand-fg shadow hover:bg-brand-hover disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
