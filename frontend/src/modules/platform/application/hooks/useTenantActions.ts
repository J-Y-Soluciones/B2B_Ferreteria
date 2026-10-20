// src/modules/platform/application/hooks/useTenantActions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/httpClient";
import Swal from "sweetalert2";
import { alertService } from "@/shared/utils/alerts";
import { PLATFORM_TENANTS_QUERY_KEY } from "./usePlatformTenants";
import { PLATFORM_METRICS_QUERY_KEY } from "./usePlatformMetrics";
import { EditTenantFormInput } from "../../presentation/schemas/editTenant.schemas";
import type { TenantContext } from "@/modules/auth/models/auth.types";
import type {
  PlatformTenant,
  TenantListResult,
} from "../../domain/models/platformTenant.types";

export interface ImpersonateTenantResponse {
  readonly accessToken?: string;
  readonly token?: string;
  readonly user: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
    readonly role: "TENANT_ADMIN" | "SUPERADMIN";
  };
  readonly tenant?: {
    readonly id: string;
    readonly businessName?: string;
    readonly tradeName?: string;
    readonly ruc?: string;
    readonly profile?: "HARDWARE_STORE" | "LUBRICENTER";
    readonly moduleCredits?: boolean;
    readonly moduleMultiwarehouse?: boolean;
    readonly moduleSunat?: boolean;
    readonly allowNegativeStock?: boolean;
    readonly modules?: {
      readonly credits?: boolean;
      readonly multiwarehouse?: boolean;
      readonly sunat?: boolean;
      readonly multiStock?: boolean;
    };
  };
}

export interface ToggleStatusPayload {
  readonly tenantId: string;
  readonly newStatus: "ACTIVE" | "SUSPENDED";
}

export interface RenewSubscriptionPayload {
  readonly tenant: PlatformTenant;
  readonly additionalDays?: number;
}

export interface UpdateTenantPayload {
  tenantId: string;
  data: EditTenantFormInput;
}

export function useTenantActions() {
  const queryClient = useQueryClient();

  // 1. Mutación para Impersonar Comercio
  const impersonateMutation = useMutation<
    ImpersonateTenantResponse,
    Error,
    string
  >({
    mutationFn: async (tenantId: string) => {
      const response = await httpClient.post<ImpersonateTenantResponse>(
        `/platform/tenants/${tenantId}/impersonate`,
      );
      return response.data;
    },
    onSuccess: async (data, tenantId) => {
      const currentToken =
        localStorage.getItem("jypos_token") ??
        localStorage.getItem("auth_token") ??
        "";
      const currentSession = localStorage.getItem("jypos_session");

      if (!localStorage.getItem("superadmin_backup_token") && currentToken) {
        localStorage.setItem("superadmin_backup_token", currentToken);
        if (currentSession) {
          localStorage.setItem("superadmin_backup_session", currentSession);
        }
      }

      const cachedTenants = queryClient.getQueryData<TenantListResult>(
        PLATFORM_TENANTS_QUERY_KEY,
      );
      const cachedTenant = cachedTenants?.items?.find(
        (t: PlatformTenant) => t.id === tenantId,
      );

      const effectiveToken = data.accessToken || data.token || "";
      const effectiveTenantId = data.tenant?.id || tenantId;
      const effectiveTradeName =
        data.tenant?.tradeName || cachedTenant?.tradeName || "Comercio B2B";

      const rawTenant = (data.tenant ?? {}) as Record<string, unknown>;
      const rawModules = (rawTenant.modules ?? {}) as Record<string, boolean>;

      const hasMultiwarehouse = Boolean(
        cachedTenant?.modules?.multiwarehouse ??
        rawTenant.moduleMultiwarehouse ??
        rawTenant.module_multiwarehouse ??
        rawModules.multiwarehouse ??
        rawModules.multiStock ??
        false,
      );

      const hasSunat = Boolean(
        cachedTenant?.modules?.sunat ??
        rawTenant.moduleSunat ??
        rawTenant.module_sunat ??
        rawModules.sunat ??
        false,
      );

      const hasCredits = Boolean(
        cachedTenant?.modules?.credits ??
        rawTenant.moduleCredits ??
        rawTenant.module_credits ??
        rawModules.credits ??
        false,
      );

      const tenantContext: TenantContext = {
        id: effectiveTenantId,
        businessName:
          data.tenant?.businessName ||
          cachedTenant?.businessName ||
          effectiveTradeName,
        tradeName: effectiveTradeName,
        ruc: data.tenant?.ruc || cachedTenant?.ruc || "20000000000",
        profile: data.tenant?.profile || cachedTenant?.profile || "LUBRICENTER",
        moduleCredits: hasCredits,
        moduleMultiwarehouse: hasMultiwarehouse,
        moduleSunat: hasSunat,
        allowNegativeStock: Boolean(
          cachedTenant?.modules?.allowNegativeStock ??
          rawTenant.allowNegativeStock ??
          rawTenant.allow_negative_stock ??
          false,
        ),
      };

      const impersonatedSession = {
        accessToken: effectiveToken,
        token: effectiveToken,
        user: data.user,
        tenant: tenantContext,
      };

      localStorage.setItem("jypos_token", effectiveToken);
      localStorage.setItem("jypos_tenant_id", effectiveTenantId);
      localStorage.setItem("auth_token", effectiveToken);
      localStorage.setItem("tenant_id", effectiveTenantId);
      localStorage.setItem(
        "jypos_session",
        JSON.stringify(impersonatedSession),
      );

      localStorage.setItem("is_impersonating", "true");
      localStorage.setItem("impersonated_tenant_name", effectiveTradeName);

      httpClient.defaults.headers.common["Authorization"] =
        `Bearer ${effectiveToken}`;
      httpClient.defaults.headers.common["X-Tenant-Id"] = effectiveTenantId;

      queryClient.clear();

      await Swal.fire({
        icon: "success",
        title: "Auditoría Iniciada",
        text: `Sesión iniciada en "${effectiveTradeName}" con privilegios de soporte.`,
        confirmButtonText: "Entrar al POS",
        confirmButtonColor: "#f59e0b",
        background: "#0f172a",
        color: "#f8fafc",
        customClass: {
          popup:
            "border border-amber-500/30 rounded-2xl font-mono text-xs shadow-2xl",
          title: "text-amber-400 font-bold",
        },
      });

      window.location.href = "/pos";
    },
    onError: (err: Error) => {
      alertService.error("Fallo al impersonar comercio", err.message);
    },
  });

  // 2. Mutación para Reactivar / Suspender Comercio
  const toggleStatusMutation = useMutation<void, Error, ToggleStatusPayload>({
    mutationFn: async ({ tenantId, newStatus }) => {
      await httpClient.patch(`/platform/tenants/${tenantId}/status`, {
        status: newStatus,
      });
    },
    onSuccess: async (_, variables) => {
      const isReactivation = variables.newStatus === "ACTIVE";
      alertService.success(
        isReactivation ? "Servicio Reactivado" : "Servicio Suspendido",
        isReactivation
          ? "El comercio ha sido reactivado y renovado satisfactoriamente."
          : "El comercio ha sido suspendido inmediatamente.",
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_TENANTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PLATFORM_METRICS_QUERY_KEY }),
      ]);
    },
    onError: (err: Error) => {
      alertService.error("Error al actualizar estado", err.message);
    },
  });

  // 3. Mutación para Renovar Suscripción (+30 Días o Pago Mensual)
  const renewSubscriptionMutation = useMutation<
    void,
    Error,
    RenewSubscriptionPayload
  >({
    mutationFn: async ({ tenant, additionalDays = 30 }) => {
      const currentExpiry = new Date(tenant.expiresAt);
      const now = new Date();

      // Si ya estaba vencido, empezamos a contar desde hoy. Si no, extendemos sobre la fecha actual.
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + additionalDays);

      await httpClient.patch(`/platform/tenants/${tenant.id}/status`, {
        status: "ACTIVE",
        reason: `Pago de membresía verificado. Renovación de ${additionalDays} días.`,
        new_expires_at: targetDate.toISOString(),
      });
    },
    onSuccess: async () => {
      alertService.success(
        "Membresía Renovada",
        "Se registraron +30 días al periodo del comercio. Fecha de corte actualizada.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_TENANTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PLATFORM_METRICS_QUERY_KEY }),
      ]);
    },
    onError: (err: Error) => {
      alertService.error("Error al renovar periodo", err.message);
    },
  });

  // 4. Mutación para Editar Comercio
  const updateTenantMutation = useMutation<void, Error, UpdateTenantPayload>({
    mutationFn: async ({ tenantId, data }) => {
      const payload = {
        businessName: data.businessName,
        tradeName: data.tradeName,
        profile: data.profile,
        allowNegativeStock: data.modules.allowNegativeStock,
        allow_negative_stock: data.modules.allowNegativeStock,
        moduleMultiwarehouse: data.modules.moduleMultiwarehouse,
        moduleSunat: data.modules.moduleSunat,
        moduleCredits: data.modules.moduleCredits,
        plan: {
          subscriptionStatus: data.plan.subscriptionStatus,
          dueDay: data.plan.dueDay,
          maxCashRegisters: data.plan.maxCashRegisters,
          maxUsers: data.plan.maxUsers,
          monthlyFee: data.plan.monthlyFee,
        },
        modules: {
          moduleSunat: data.modules.moduleSunat,
          moduleCredits: data.modules.moduleCredits,
          moduleMultiwarehouse: data.modules.moduleMultiwarehouse,
          allowNegativeStock: data.modules.allowNegativeStock,
          sunat: data.modules.moduleSunat,
          credits: data.modules.moduleCredits,
          multiwarehouse: data.modules.moduleMultiwarehouse,
          allow_negative_stock: data.modules.allowNegativeStock,
        },
      };

      await httpClient.patch(`/platform/tenants/${tenantId}`, payload);
    },
    onSuccess: async () => {
      alertService.success(
        "Comercio Actualizado",
        "La configuración de la empresa, planes y módulos ha sido guardada.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_TENANTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PLATFORM_METRICS_QUERY_KEY }),
      ]);
    },
    onError: (err: Error) => {
      alertService.error("Fallo al actualizar comercio", err.message);
    },
  });

  // 5. Mutación para Eliminar Comercio
  const deleteTenantMutation = useMutation<void, Error, string>({
    mutationFn: async (tenantId: string) => {
      await httpClient.delete(`/platform/tenants/${tenantId}`);
    },
    onSuccess: async () => {
      alertService.success(
        "Comercio Eliminado",
        "La suscripción y acceso del comercio han sido eliminados del registro activo.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_TENANTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PLATFORM_METRICS_QUERY_KEY }),
      ]);
    },
    onError: (err: Error) => {
      alertService.error("Fallo al eliminar comercio", err.message);
    },
  });

  return {
    impersonate: impersonateMutation.mutateAsync,
    isImpersonating: impersonateMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,
    renewSubscription: renewSubscriptionMutation.mutateAsync,
    isRenewingSubscription: renewSubscriptionMutation.isPending,
    updateTenant: updateTenantMutation.mutateAsync,
    isUpdatingTenant: updateTenantMutation.isPending,
    deleteTenant: deleteTenantMutation.mutateAsync,
    isDeletingTenant: deleteTenantMutation.isPending,
  };
}
