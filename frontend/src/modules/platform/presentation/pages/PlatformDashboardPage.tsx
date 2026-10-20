// src/modules/platform/presentation/pages/PlatformDashboardPage.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { usePlatformMetrics } from "../../application/hooks/usePlatformMetrics";
import { usePlatformTenants } from "../../application/hooks/usePlatformTenants";
import { useTenantActions } from "../../application/hooks/useTenantActions";
import { PlatformGlobalHeader } from "../components/header/PlatformGlobalHeader";
import { PlatformMetricsRow } from "../components/kpi/PlatformMetricsRow";
import { PlatformMetricsSkeleton } from "../components/kpi/PlatformMetricsSkeleton";
import { TenantTableToolbar } from "../components/table/TenantTableToolbar";
import { TenantManagementTable } from "../components/table/TenantManagementTable";
import { TenantTableSkeleton } from "../components/table/TenantTableSkeleton";
import { OnboardingDrawer } from "../components/drawer/OnboardingDrawer";
import { EditTenantModal } from "../components/modal/EditTenantModal";
import { alertService } from "@/shared/utils/alerts";

import type {
  SubscriptionStatus,
  TenantBusinessProfile,
  PlatformTenant,
} from "../../domain/models/platformTenant.types";

// Jerarquía estricta de orden: Activos primero, luego Pruebas, Suspendidos al final
const STATUS_PRIORITY: Record<SubscriptionStatus, number> = {
  ACTIVE: 1,
  TRIAL: 2,
  SUSPENDED: 3,
  CANCELLED: 4,
};

export function PlatformDashboardPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">(
    "ALL",
  );
  const [profileFilter, setProfileFilter] = useState<
    TenantBusinessProfile | "ALL"
  >("ALL");
  const [moduleFilter, setModuleFilter] = useState<
    "sunat" | "credits" | "multiwarehouse" | undefined
  >(undefined);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<PlatformTenant | null>(
    null,
  );

  // Queries: Obtenemos los comercios
  const { data: metrics, isLoading: isMetricsLoading } = usePlatformMetrics();
  const { data: tenantsResult, isLoading: isTenantsLoading } =
    usePlatformTenants({
      search: searchTerm,
    });

  // Acciones (Reactivar, Suspender, Impersonar, Renovar, Editar, Eliminar)
  const {
    toggleStatus,
    renewSubscription,
    impersonate,
    isImpersonating,
    deleteTenant,
    updateTenant,
    isUpdatingTenant,
  } = useTenantActions();

  const tenantsList = useMemo(() => {
    return tenantsResult?.items ?? [];
  }, [tenantsResult]);

  // Contadores estables (siempre calculan sobre la lista completa de tenants)
  const statusCounts = useMemo(() => {
    return {
      all: tenantsList.length,
      active: tenantsList.filter((t) => t.status === "ACTIVE").length,
      trial: tenantsList.filter((t) => t.status === "TRIAL").length,
      suspended: tenantsList.filter((t) => t.status === "SUSPENDED").length,
    };
  }, [tenantsList]);

  // Filtrado reactivo y ordenamiento por prioridad de estado
  const filteredTenants = useMemo(() => {
    const list = tenantsList.filter((t) => {
      // 1. Filtro por Estado (Pestañas)
      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }
      // 2. Filtro por Rubro (Ferretería vs Lubricentro)
      if (profileFilter !== "ALL" && t.profile !== profileFilter) {
        return false;
      }
      // 3. Filtro por Módulos
      if (moduleFilter && !t.modules[moduleFilter]) {
        return false;
      }
      return true;
    });

    // Orden inmutable sin mutar el array original
    return [...list].sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] ?? 99;
      const priorityB = STATUS_PRIORITY[b.status] ?? 99;
      return priorityA - priorityB;
    });
  }, [tenantsList, statusFilter, profileFilter, moduleFilter]);

  useKeyboardShortcuts({
    F9: () => setIsOnboardingOpen(true),
    Escape: () => setIsOnboardingOpen(false),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Impersonar comercio
  const handleImpersonate = async (tenantId: string) => {
    const res = await alertService.confirm({
      title: "Auditoría de Terminal POS",
      text: "¿Deseas iniciar sesión en caliente dentro de esta tienda con privilegios de soporte?",
      confirmButtonText: "Ingresar como Auditor",
      confirmButtonColor: "#f59e0b",
      icon: "question",
    });

    if (res.isConfirmed) {
      await impersonate(tenantId);
    }
  };

  // Renovar membresía (+30 días)
  const handleRenewSubscription = async (tenant: PlatformTenant) => {
    const res = await alertService.confirm({
      title: "Registrar Pago de Mensualidad",
      text: `¿Confirmas el pago del periodo para "${tenant.tradeName}"? Se extenderá la fecha de corte +30 días manteniendo el servicio activo.`,
      confirmButtonText: "Sí, Renovar +30 Días",
      confirmButtonColor: "#10B981",
      icon: "question",
    });

    if (res.isConfirmed) {
      await renewSubscription({ tenant, additionalDays: 30 });
    }
  };

  // Handler para eliminación con confirmación estricta
  const handleDeleteTenant = async (tenant: PlatformTenant) => {
    const res = await alertService.confirm({
      title: "Eliminar Registro de Comercio",
      text: `¿Estás seguro de ELIMINAR definitivamente a "${tenant.tradeName}"? Esta acción revoca todas las llaves de acceso.`,
      confirmButtonText: "Sí, Eliminar Comercio",
      confirmButtonColor: "#EF4444",
      icon: "warning",
    });

    if (res.isConfirmed) {
      await deleteTenant(tenant.id);
    }
  };

  // Alternar estado de suscripción
  const handleToggleStatus = async (tenant: PlatformTenant) => {
    const isSuspended = tenant.status === "SUSPENDED";
    const newStatus = isSuspended ? "ACTIVE" : "SUSPENDED";

    const res = await alertService.confirm({
      title: isSuspended ? "Reactivar Servicio" : "Suspender Servicio",
      text: isSuspended
        ? `¿Deseas REACTIVAR y renovar por 30 días el acceso a "${tenant.tradeName}"?`
        : `¿Confirmas la suspensión inmediata por falta de pago a "${tenant.tradeName}"?`,
      confirmButtonText: isSuspended ? "Sí, Reactivar" : "Sí, Suspender",
      confirmButtonColor: isSuspended ? "#10B981" : "#EF4444",
      icon: isSuspended ? "question" : "warning",
    });

    if (res.isConfirmed) {
      await toggleStatus({
        tenantId: tenant.id,
        newStatus,
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-canvas overflow-hidden text-foreground">
      <PlatformGlobalHeader
        telemetry={metrics?.telemetry}
        adminHandle={
          session?.user?.fullName
            ? `@${session.user.fullName.toLowerCase().replace(/\s+/g, "_")}`
            : "@superadmin_jy"
        }
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMetricsLoading || !metrics ? (
          <PlatformMetricsSkeleton />
        ) : (
          <PlatformMetricsRow metrics={metrics} />
        )}

        <TenantTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentStatus={statusFilter}
          onStatusChange={setStatusFilter}
          currentProfile={profileFilter}
          onProfileChange={setProfileFilter}
          activeModuleFilter={moduleFilter}
          onModuleFilterChange={setModuleFilter}
          statusCounts={statusCounts}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />

        {isTenantsLoading ? (
          <TenantTableSkeleton rows={4} />
        ) : (
          <TenantManagementTable
            tenants={filteredTenants}
            onImpersonate={handleImpersonate}
            onToggleStatus={handleToggleStatus}
            onRenewSubscription={handleRenewSubscription}
            onEditTenant={setEditingTenant}
            onDeleteTenant={handleDeleteTenant}
            isImpersonating={isImpersonating}
          />
        )}
      </main>

      <footer className="h-7 border-t border-border-strong bg-surface px-4 flex items-center justify-between text-[10px] font-mono text-foreground-muted select-none">
        <div className="flex items-center gap-4">
          <span>
            <kbd className="text-foreground font-bold">F1</kbd> Ayuda
          </span>
          <span>
            <kbd className="text-foreground font-bold">F2</kbd> Buscar Tenant
          </span>
          <span>
            <kbd className="text-foreground font-bold">F4</kbd> Filtrar Estado
          </span>
          <span>
            <kbd className="text-foreground font-bold">F9</kbd> Nuevo Onboarding
          </span>
          <span>
            <kbd className="text-foreground font-bold">ESC</kbd> Cerrar
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Gateway: api.jysoluciones.pe
          </span>
          <span>Database: PostgreSQL 16</span>
          <span className="text-brand font-bold">
            Superadmin Session TTL: 42m
          </span>
        </div>
      </footer>

      <OnboardingDrawer
        open={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <EditTenantModal
        tenant={editingTenant}
        open={Boolean(editingTenant)}
        onClose={() => setEditingTenant(null)}
        onSave={async (tenantId, data) => {
          await updateTenant({ tenantId, data });
        }}
        isSubmitting={isUpdatingTenant}
      />
    </div>
  );
}
