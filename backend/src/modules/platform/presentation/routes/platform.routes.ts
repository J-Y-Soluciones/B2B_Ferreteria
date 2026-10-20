import { FastifyInstance } from "fastify";
import { PlatformTenantController } from "../controllers/platform-tenant.controller.js";
import { PlatformMetricsController } from "../controllers/platform-metrics.controller.js";
import { PlatformAuditController } from "../controllers/platform-audit.controller.js";

export function registerPlatformRoutes(
  server: FastifyInstance,
  tenantController: PlatformTenantController,
  metricsController: PlatformMetricsController,
  auditController: PlatformAuditController,
  platformGuard: any,
) {
  server.register(
    async (platformScope) => {
      // Perímetro estricto de seguridad: Rol SUPERADMIN obligatorio
      platformScope.addHook("preHandler", platformGuard);

      // Módulo B: Métricas Globales
      platformScope.get("/metrics", (req, rep) =>
        metricsController.getMetrics(req, rep),
      );

      // Módulo D: Bitácora de Auditoría
      platformScope.get("/audit-logs", (req, rep) =>
        auditController.listLogs(req, rep),
      );

      // Módulo A: Gestión de Comercios
      platformScope.get("/tenants", (req, rep) =>
        tenantController.listTenants(req, rep),
      );
      platformScope.get("/tenants/:id", (req, rep) =>
        tenantController.getTenantById(req as any, rep),
      );
      platformScope.post("/tenants", (req, rep) =>
        tenantController.onboardTenant(req, rep),
      );
      // 👇 Ruta Consolidada PATCH /tenants/:id
      platformScope.patch("/tenants/:id", (req, rep) =>
        tenantController.updateTenant(req as any, rep),
      );
      platformScope.patch("/tenants/:id/status", (req, rep) =>
        tenantController.updateStatus(req as any, rep),
      );
      platformScope.patch("/tenants/:id/modules", (req, rep) =>
        tenantController.updateModules(req as any, rep),
      );
      platformScope.post("/tenants/:id/impersonate", (req, rep) =>
        tenantController.impersonateTenant(req as any, rep),
      );
    },
    { prefix: "/api/v1/platform" },
  );
}
