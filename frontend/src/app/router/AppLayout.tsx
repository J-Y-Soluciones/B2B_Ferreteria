// src/app/router/AppLayout.tsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  BottomHotkeyBar,
  type HotkeyItem,
} from "@/shared/components/ui/BottomHotkeyBar";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { BlindCloseShiftModal } from "@/modules/cash-shifts/components/BlindCloseShiftModal";
import { OpenShiftModal } from "@/modules/cash-shifts/components/OpenShiftModal";
import {
  useCashShift,
  useCurrentShift,
} from "@/modules/cash-shifts/hooks/useCashShift";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useTheme } from "@/shared/hooks/useTheme";
import { ImpersonationBanner } from "@/shared/components/layout/ImpersonationBanner";
import {
  ShoppingCart,
  Package,
  Boxes,
  Users,
  UserCheck,
  FileText,
  Lock,
  Unlock,
  Store,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

export function AppLayout() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isSuperadmin =
    session?.user?.role === "SUPERADMIN" ||
    session?.user?.role === "SUPER_ADMIN";

  // Consulta reactiva del turno según usuario y tenant
  const { data: currentShift } = useCurrentShift();
  const isShiftOpen = currentShift?.status === "OPEN";
  const activeShiftId = currentShift?.id ?? "";

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const { closeShift, isClosing } = useCashShift({
    onCloseSuccess: () => {
      setIsCloseModalOpen(false);
      navigate("/pos");
    },
  });

  const userRole = session?.user?.role as string | undefined;
  const isAdmin = userRole === "TENANT_ADMIN";
  const isCashier = userRole === "CASHIER";
  const isWarehouseOperator = userRole === "WAREHOUSE_OPERATOR";

  const canAccessPos = isAdmin || isCashier;
  const canViewCatalog = isAdmin || isCashier;
  const canViewInventory = isAdmin || isWarehouseOperator;

  // Propiedad según la interfaz TenantContext de auth.types.ts
  const hasFiscalModule = Boolean(session?.tenant?.moduleSunat);

  const handleToggleShiftModal = () => {
    if (isShiftOpen) {
      setIsCloseModalOpen(true);
    } else {
      setIsOpenModalOpen(true);
    }
  };

  useKeyboardShortcuts({
    F1: () => {
      if (canAccessPos) navigate("/pos");
    },
    F3: () => {
      if (canViewInventory) navigate("/inventory");
    },
    F4: () => {
      if (canViewCatalog) navigate("/catalog");
    },
    F6: () => {
      if (isAdmin) navigate("/customers");
    },
    F7: () => {
      if (hasFiscalModule) {
        navigate("/fiscal");
      } else if (isAdmin) {
        navigate("/sales-history");
      }
    },
    F8: () => {
      if (canAccessPos) handleToggleShiftModal();
    },
  });

  const hotkeys: HotkeyItem[] = [
    ...(canAccessPos
      ? [{ key: "F1", label: "Terminal POS", action: () => navigate("/pos") }]
      : []),
    { key: "F2", label: "Buscar / Pistola" },
    ...(canViewInventory
      ? [
          {
            key: "F3",
            label: "Almacén",
            action: () => navigate("/inventory"),
          },
        ]
      : []),
    ...(canViewCatalog
      ? [{ key: "F4", label: "Catálogo", action: () => navigate("/catalog") }]
      : []),
    ...(isAdmin
      ? [
          {
            key: "F6",
            label: "Clientes / Fiados",
            action: () => navigate("/customers"),
          },
          {
            key: "F7",
            label: hasFiscalModule ? "Monitor Fiscal" : "Historial Ventas",
            action: () =>
              navigate(hasFiscalModule ? "/fiscal" : "/sales-history"),
          },
        ]
      : []),
    ...(canAccessPos
      ? [
          {
            key: "F8",
            label: isShiftOpen ? "Cerrar Turno" : "Abrir Turno",
            action: handleToggleShiftModal,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-foreground">
      {/* Banner de Auditoría / Impersonación */}
      <ImpersonationBanner />

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-strong bg-surface px-4 select-none print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono font-bold text-brand">
            <Store className="h-5 w-5" />
            <span className="tracking-wider">
              {session?.tenant?.tradeName ?? "JYPoS Industrial"}
            </span>
          </div>
          <span className="text-border-strong">|</span>
          <nav className="flex items-center gap-1 font-mono text-xs">
            {canAccessPos && (
              <NavLink
                to="/pos"
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                    isActive
                      ? "bg-surface-elevated text-brand font-bold"
                      : "text-foreground-secondary hover:text-foreground"
                  }`
                }
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>POS (F1)</span>
              </NavLink>
            )}

            {canViewCatalog && (
              <NavLink
                to="/catalog"
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                    isActive
                      ? "bg-surface-elevated text-brand font-bold"
                      : "text-foreground-secondary hover:text-foreground"
                  }`
                }
              >
                <Package className="h-3.5 w-3.5" />
                <span>Catálogo (F4)</span>
              </NavLink>
            )}

            {/* Acceso a Almacén & Kardex */}
            {canViewInventory && (
              <NavLink
                to="/inventory"
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                    isActive
                      ? "bg-surface-elevated text-brand font-bold"
                      : "text-foreground-secondary hover:text-foreground"
                  }`
                }
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Almacén (F3)</span>
              </NavLink>
            )}

            {isAdmin && (
              <>
                <NavLink
                  to="/customers"
                  className={({ isActive }: { isActive: boolean }) =>
                    `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                      isActive
                        ? "bg-surface-elevated text-brand font-bold"
                        : "text-foreground-secondary hover:text-foreground"
                    }`
                  }
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Fiados (F6)</span>
                </NavLink>

                <NavLink
                  to="/team"
                  className={({ isActive }: { isActive: boolean }) =>
                    `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                      isActive
                        ? "bg-surface-elevated text-brand font-bold"
                        : "text-foreground-secondary hover:text-foreground"
                    }`
                  }
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Equipo</span>
                </NavLink>

                {hasFiscalModule ? (
                  <NavLink
                    to="/fiscal"
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                        isActive
                          ? "bg-surface-elevated text-brand font-bold"
                          : "text-foreground-secondary hover:text-foreground"
                      }`
                    }
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Monitor SUNAT (F7)</span>
                  </NavLink>
                ) : (
                  <NavLink
                    to="/sales-history"
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
                        isActive
                          ? "bg-surface-elevated text-brand font-bold"
                          : "text-foreground-secondary hover:text-foreground"
                      }`
                    }
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Ventas (F7)</span>
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternancia de tema */}
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

          {isSuperadmin && (
            <button
              type="button"
              onClick={() => navigate("/platform")}
              className="rounded border border-brand/40 bg-brand/10 px-2 py-1 font-mono text-xs font-bold text-brand hover:bg-brand hover:text-brand-fg transition-all"
            >
              Panel SaaS
            </button>
          )}

          <div className="flex flex-col text-right font-mono text-[10px]">
            <span className="font-bold text-foreground">
              {session?.user?.fullName}
            </span>
            <span className="text-foreground-muted">{session?.user?.role}</span>
          </div>

          {/* Botón dinámico de Caja (Oculto para operarios de almacén) */}
          {canAccessPos &&
            (isShiftOpen ? (
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center gap-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Arqueo (F8)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpenModalOpen(true)}
                className="flex items-center gap-1.5 rounded border border-emerald-500/50 bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm animate-pulse"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Abrir Caja (F8)</span>
              </button>
            ))}

          <button
            type="button"
            onClick={() => {
              void logout();
              navigate("/login");
            }}
            title="Cerrar Sesión"
            className="rounded p-1 text-foreground-muted hover:text-rose-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Modal de Apertura de Caja */}
      <OpenShiftModal
        open={isOpenModalOpen}
        onOpenChange={setIsOpenModalOpen}
      />

      {/* Modal de Cierre / Arqueo Ciego */}
      <BlindCloseShiftModal
        open={isCloseModalOpen}
        onOpenChange={setIsCloseModalOpen}
        onSubmitClose={async (input) => {
          if (!activeShiftId) return;
          await closeShift({
            shiftId: activeShiftId,
            ...input,
          });
        }}
        isSubmitting={isClosing}
      />

      <div className="print:hidden">
        <BottomHotkeyBar hotkeys={hotkeys} />
      </div>
    </div>
  );
}
