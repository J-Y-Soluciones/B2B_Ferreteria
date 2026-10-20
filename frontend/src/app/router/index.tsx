// src/app/router/index.tsx
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { SuperadminRoute } from "./SuperadminRoute";
import { SuspenseFallback } from "@/shared/components/feedback/SuspenseFallback";
import { useAuth } from "@/modules/auth/hooks/useAuth";

const LoginPage = lazy(() =>
  import("@/modules/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/modules/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/modules/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const ForceChangePasswordPage = lazy(() =>
  import("@/modules/auth/pages/ForceChangePasswordPage").then((m) => ({
    default: m.ForceChangePasswordPage,
  })),
);
const PosTerminalPage = lazy(() =>
  import("@/modules/pos/pages/PosTerminalPage").then((m) => ({
    default: m.PosTerminalPage,
  })),
);
const CatalogPage = lazy(() =>
  import("@/modules/catalog/pages/CatalogPage").then((m) => ({
    default: m.CatalogPage,
  })),
);
const InventoryPage = lazy(() =>
  import("@/modules/inventory/pages/InventoryPage").then((m) => ({
    default: m.InventoryPage,
  })),
);
const CustomersPage = lazy(() =>
  import("@/modules/customers/pages/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  })),
);
const TeamManagementPage = lazy(() =>
  import("@/modules/team/pages/TeamManagementPage").then((m) => ({
    default: m.TeamManagementPage,
  })),
);
const SalesHistoryPage = lazy(() =>
  import("@/modules/sales-history/pages/SalesHistoryPage").then((m) => ({
    default: m.SalesHistoryPage,
  })),
);
const FiscalMonitorPage = lazy(() =>
  import("@/modules/fiscal/pages/FiscalMonitorPage").then((m) => ({
    default: m.FiscalMonitorPage,
  })),
);

// MÓDULO SUPERADMIN PLATFORM
const PlatformDashboardPage = lazy(() =>
  import("@/modules/platform/presentation/pages/PlatformDashboardPage").then(
    (m) => ({
      default: m.PlatformDashboardPage,
    }),
  ),
);

function RootRedirect() {
  const { session } = useAuth();
  const userRole = session?.user?.role;

  if (userRole === "SUPERADMIN" || userRole === "SUPER_ADMIN") {
    return <Navigate to="/platform" replace />;
  }

  // Si es operador de patio/almacén, entra directo a Kardex y existencias
  if ((userRole as string) === "WAREHOUSE_OPERATOR") {
    return <Navigate to="/inventory" replace />;
  }

  return <Navigate to="/pos" replace />;
}

const router = createBrowserRouter([
  // 1. RUTAS PÚBLICAS DE AUTENTICACIÓN
  {
    path: "/login",
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },

  // 2. RUTA PROTEGIDA DE PRIMER INGRESO (Sin AppLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/force-change-password",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ForceChangePasswordPage />
          </Suspense>
        ),
      },
    ],
  },

  // 3. RUTAS EXCLUSIVAS DE SUPERADMIN (Panel SaaS)
  {
    element: <SuperadminRoute />,
    children: [
      {
        path: "/platform",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <PlatformDashboardPage />
          </Suspense>
        ),
      },
    ],
  },

  // 4. RUTAS DE TIENDA / TENANT (POS, Catálogo, Almacén, Fiados, Equipo, Fiscal)
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <RootRedirect />,
          },
          {
            path: "pos",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <PosTerminalPage />
              </Suspense>
            ),
          },
          {
            path: "catalog",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <CatalogPage />
              </Suspense>
            ),
          },
          {
            path: "inventory",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <InventoryPage />
              </Suspense>
            ),
          },
          {
            path: "customers",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <CustomersPage />
              </Suspense>
            ),
          },
          {
            path: "team",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <TeamManagementPage />
              </Suspense>
            ),
          },
          {
            path: "sales-history",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <SalesHistoryPage />
              </Suspense>
            ),
          },
          {
            path: "fiscal",
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <FiscalMonitorPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/pos" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
