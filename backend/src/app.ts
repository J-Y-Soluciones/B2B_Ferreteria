// src/app.ts
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import { env } from "./core/config/env.js";
import { DatabaseSchema } from "./shared/infrastructure/database/database.types.js";
import { KyselyUnitOfWork } from "./shared/infrastructure/database/kysely-unit-of-work.js";

// Módulos e Infraestructura: Identity
import { KyselyUserRepository } from "./modules/identity/infrastructure/kysely-user.repository.js";
import { Argon2PasswordHasher } from "./modules/identity/infrastructure/argon2-password-hasher.js";
import { JoseTokenService } from "./modules/identity/infrastructure/jose-token.service.js";
import { NodemailerEmailService } from "./modules/identity/infrastructure/nodemailer-email.service.js";
import { LoginUseCase } from "./modules/identity/application/login.use-case.js";
import { ForgotPasswordUseCase } from "./modules/identity/application/forgot-password.use-case.js";
import { ResetPasswordUseCase } from "./modules/identity/application/reset-password.use-case.js";
import { ChangeInitialPasswordUseCase } from "./modules/identity/application/change-initial-password.use-case.js";
import { AuthController } from "./modules/identity/presentation/auth.controller.js";
import { authRoutes } from "./modules/identity/presentation/auth.routes.js";
import { createTenantGuard } from "./shared/infrastructure/http/tenant-guard.middleware.js";

// Módulo Catalog
import { KyselyProductCatalogQuery } from "./modules/catalog/infrastructure/kysely-product-catalog.query.js";
import { KyselyCatalogSearchRepository } from "./modules/catalog/infrastructure/kysely-catalog-search.repository.js";
import { ScanProductUseCase } from "./modules/catalog/application/scan-product.use-case.js";
import { SearchProductsUseCase } from "./modules/catalog/application/search-products.use-case.js";
import { CreateProductUseCase } from "./modules/catalog/application/create-product.use-case.js";
import { UpdateProductUseCase } from "./modules/catalog/application/update-product.use-case.js";
import { CatalogController } from "./modules/catalog/presentation/catalog.controller.js";
import { catalogRoutes } from "./modules/catalog/presentation/catalog.routes.js";

// Módulo POS
import { ProcessSaleUseCase } from "./modules/pos/application/process-sale.use-case.js";
import { PosController } from "./modules/pos/presentation/pos.controller.js";
import { posRoutes } from "./modules/pos/presentation/pos.routes.js";

// Módulo Cash Register
import { OpenCashShiftUseCase } from "./modules/cash-register/application/open-cash-shift.use-case.js";
import { CloseCashShiftUseCase } from "./modules/cash-register/application/close-cash-shift.use-case.js";
import { CashShiftController } from "./modules/cash-register/presentation/cash-shift.controller.js";
import { cashShiftRoutes } from "./modules/cash-register/presentation/cash-shift.routes.js";
import { GetCurrentCashShiftUseCase } from "./modules/cash-register/application/get-current-cash-shift.use-case.js";

// Módulo Credit
import { ProcessDebtPaymentUseCase } from "./modules/credit/application/process-debt-payment.use-case.js";
import { CreditController } from "./modules/credit/presentation/credit.controller.js";
import { creditRoutes } from "./modules/credit/presentation/credit.routes.js";

// Módulo Customers
import { KyselyCustomerRepository } from "./modules/customers/infrastructure/kysely-customer.repository.js";
import { CustomerController } from "./modules/customers/presentation/customer.controller.js";
import { customerRoutes } from "./modules/customers/presentation/customer.routes.js";

// Módulo Inventory
import { InventoryController } from "./modules/inventory/presentation/inventory.controller.js";
import { RegisterInventoryMovementUseCase } from "./modules/inventory/application/register-inventory-movement.use-case.js";
import { KyselyInventoryValidationQuery } from "./modules/inventory/infrastructure/kysely-inventory-validation.query.js";
import { inventoryRoutes } from "./modules/inventory/presentation/inventory.routes.js";

// Módulo Platform (Superadmin)
import { registerPlatformRoutes } from "./modules/platform/presentation/routes/platform.routes.js";
import { PlatformTenantController } from "./modules/platform/presentation/controllers/platform-tenant.controller.js";
import { PlatformMetricsController } from "./modules/platform/presentation/controllers/platform-metrics.controller.js";
import { PlatformAuditController } from "./modules/platform/presentation/controllers/platform-audit.controller.js";
import { KyselyPlatformTenantRepository } from "./modules/platform/infrastructure/database/kysely-platform-tenant.repository.js";
import { KyselyPlatformMetricsRepository } from "./modules/platform/infrastructure/database/kysely-platform-metrics.repository.js";
import { KyselyPlatformAuditRepository } from "./modules/platform/infrastructure/database/kysely-platform-audit.repository.js";
import { OnboardTenantUseCase } from "./modules/platform/application/use-cases/onboard-tenant.use-case.js";
import { UpdateSubscriptionStatusUseCase } from "./modules/platform/application/use-cases/update-subscription-status.use-case.js";
import { UpdateTenantModulesUseCase } from "./modules/platform/application/use-cases/update-tenant-modules.use-case.js";
import { UpdateTenantFullUseCase } from "./modules/platform/application/use-cases/update-tenant-full.use-case.js";
import { ImpersonateTenantUseCase } from "./modules/platform/application/use-cases/impersonate-tenant.use-case.js";
import { GetPlatformMetricsUseCase } from "./modules/platform/application/use-cases/get-platform-metrics.use-case.js";
import { ListAuditLogsUseCase } from "./modules/platform/application/use-cases/list-audit-logs.use-case.js";
import { createPlatformGuard } from "./shared/infrastructure/http/platform-guard.middleware.js";

// Módulo Fiscal (Monitor F7 / SUNAT)
import { KyselyFiscalDocumentRepository } from "./modules/fiscal/infrastructure/kysely-fiscal-document.repository.js";
import { ListFiscalDocumentsUseCase } from "./modules/fiscal/application/list-fiscal-documents.use-case.js";
import { RetryFiscalDocumentUseCase } from "./modules/fiscal/application/retry-fiscal-document.use-case.js";
import { GetFiscalDocumentFilesUseCase } from "./modules/fiscal/application/get-fiscal-document-files.use-case.js";
import { FiscalController } from "./modules/fiscal/presentation/controllers/fiscal.controller.js";
import { registerFiscalRoutes } from "./modules/fiscal/presentation/routes/fiscal.routes.js";

// Módulo Fiscal: Worker en segundo plano
import { KyselyFiscalOutboxRepository } from "./modules/fiscal/infrastructure/kysely-fiscal-outbox.repository.js";
import { ProcessFiscalOutboxUseCase } from "./modules/fiscal/application/process-fiscal-outbox.use-case.js";
import { FiscalOutboxWorker } from "./modules/fiscal/infrastructure/fiscal-outbox.worker.js";
import { StubFiscalPseClient } from "./modules/fiscal/infrastructure/stub-fiscal-pse.client.js";

export async function buildApp(): Promise<{
  app: FastifyInstance;
  pool: Pool;
}> {
  const app = Fastify({
    routerOptions: {
      ignoreTrailingSlash: true,
    },
    logger:
      env.NODE_ENV === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
            },
          }
        : true,
  });

  // 1. Perímetro de Seguridad OWASP
  await app.register(helmet, {
    contentSecurityPolicy: true,
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Tenant-Id",
      "Idempotency-Key",
    ],
  });

  await app.register(cookie);

  // 2. Persistencia con Pool de Conexiones
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    min: env.DATABASE_POOL_MIN,
    max: env.DATABASE_POOL_MAX,
    statement_timeout: env.DATABASE_STATEMENT_TIMEOUT_MS,
  });

  const db = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({ pool }),
  });

  const uow = new KyselyUnitOfWork(db);

  // 3. Inyección de Dependencias
  const passwordHasher = new Argon2PasswordHasher();
  const tokenService = new JoseTokenService();
  const userRepo = new KyselyUserRepository(db);
  const emailService = new NodemailerEmailService();

  // Casos de uso de autenticación y contraseñas
  const loginUseCase = new LoginUseCase(
    userRepo,
    passwordHasher,
    tokenService,
    db,
  );
  const forgotPasswordUseCase = new ForgotPasswordUseCase(db, emailService);
  const resetPasswordUseCase = new ResetPasswordUseCase(db, passwordHasher);
  const changeInitialPasswordUseCase = new ChangeInitialPasswordUseCase(
    db,
    passwordHasher,
  );

  const authController = new AuthController(
    loginUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
    changeInitialPasswordUseCase,
    tokenService,
  );

  const catalogQuery = new KyselyProductCatalogQuery(db);
  const catalogSearchRepo = new KyselyCatalogSearchRepository(db);
  const scanProductUseCase = new ScanProductUseCase(catalogSearchRepo);
  const searchProductsUseCase = new SearchProductsUseCase(catalogSearchRepo);
  const createProductUseCase = new CreateProductUseCase(db);
  const updateProductUseCase = new UpdateProductUseCase(db);
  const catalogController = new CatalogController(
    scanProductUseCase,
    searchProductsUseCase,
    createProductUseCase,
    updateProductUseCase,
  );

  // 👈 Inyección de Dependencias: Worker Fiscal Outbox
  const fiscalOutboxRepo = new KyselyFiscalOutboxRepository(db);
  const pseClient = new StubFiscalPseClient();

  const processFiscalOutboxUseCase = new ProcessFiscalOutboxUseCase(
    fiscalOutboxRepo,
    pseClient,
    { batchSize: 10, maxRetries: 3 },
  );

  const fiscalWorker = new FiscalOutboxWorker(
    processFiscalOutboxUseCase,
    5000, // Sondeo cada 5 segundos
  );

  // Iniciar ciclo de polling en segundo plano
  fiscalWorker.start();

  // Limpieza al apagar el servidor (Graceful Shutdown)
  app.addHook("onClose", async () => {
    fiscalWorker.stop();
  });

  const processSaleUseCase = new ProcessSaleUseCase(uow, catalogQuery);
  const posController = new PosController(processSaleUseCase);

  const openShiftUseCase = new OpenCashShiftUseCase(uow);
  const closeShiftUseCase = new CloseCashShiftUseCase(uow);
  const getCurrentShiftUseCase = new GetCurrentCashShiftUseCase(db);

  const cashShiftController = new CashShiftController(
    openShiftUseCase,
    closeShiftUseCase,
    getCurrentShiftUseCase,
  );

  const customerRepo = new KyselyCustomerRepository(db);
  const customerController = new CustomerController(customerRepo);

  const processDebtPaymentUseCase = new ProcessDebtPaymentUseCase(uow);
  const creditController = new CreditController(processDebtPaymentUseCase);

  const inventoryValidationQuery = new KyselyInventoryValidationQuery(db);
  const registerInventoryMovementUseCase = new RegisterInventoryMovementUseCase(
    uow,
    inventoryValidationQuery,
  );
  const inventoryController = new InventoryController(
    registerInventoryMovementUseCase,
  );

  // Inyección de Dependencias: Módulo Platform (Superadmin)
  const platformTenantRepo = new KyselyPlatformTenantRepository(db);
  const platformMetricsRepo = new KyselyPlatformMetricsRepository(db);
  const platformAuditRepo = new KyselyPlatformAuditRepository(db);

  const onboardTenantUseCase = new OnboardTenantUseCase(db, passwordHasher);
  const updateSubscriptionStatusUseCase = new UpdateSubscriptionStatusUseCase(
    db,
    platformTenantRepo,
  );
  const updateTenantModulesUseCase = new UpdateTenantModulesUseCase(
    db,
    platformTenantRepo,
  );
  const updateTenantFullUseCase = new UpdateTenantFullUseCase(
    db,
    platformTenantRepo,
  );
  const impersonateTenantUseCase = new ImpersonateTenantUseCase(
    platformTenantRepo,
    userRepo,
    tokenService,
    db,
  );
  const getPlatformMetricsUseCase = new GetPlatformMetricsUseCase(
    platformMetricsRepo,
  );
  const listAuditLogsUseCase = new ListAuditLogsUseCase(platformAuditRepo);

  const platformTenantController = new PlatformTenantController(
    onboardTenantUseCase,
    updateSubscriptionStatusUseCase,
    updateTenantModulesUseCase,
    impersonateTenantUseCase,
    updateTenantFullUseCase,
    platformTenantRepo,
    tokenService,
  );

  const platformMetricsController = new PlatformMetricsController(
    getPlatformMetricsUseCase,
  );
  const platformAuditController = new PlatformAuditController(
    listAuditLogsUseCase,
  );

  const platformGuard = createPlatformGuard(tokenService);

  // Inyección de Dependencias: Módulo Fiscal (Monitor F7 / SUNAT)
  const fiscalRepo = new KyselyFiscalDocumentRepository(db);
  const listFiscalDocsUseCase = new ListFiscalDocumentsUseCase(fiscalRepo);
  const retryFiscalDocUseCase = new RetryFiscalDocumentUseCase(fiscalRepo);
  const getFiscalFilesUseCase = new GetFiscalDocumentFilesUseCase(fiscalRepo);
  const fiscalController = new FiscalController(
    listFiscalDocsUseCase,
    retryFiscalDocUseCase,
    getFiscalFilesUseCase,
  );

  // 4. Endpoint de Salud (Liveness/Readiness)
  app.get("/health", async (_req, reply) => {
    try {
      await pool.query("SELECT 1");
      return reply.status(200).send({
        status: "UP",
        database: "CONNECTED",
        timestamp: new Date().toISOString(),
      });
    } catch {
      return reply
        .status(503)
        .send({ status: "DOWN", database: "DISCONNECTED" });
    }
  });

  // 5. Registro de Rutas Públicas (Auth)
  await app.register(authRoutes, {
    prefix: `${env.API_PREFIX}/auth`,
    controller: authController,
  });

  // 5.1. Registro de Rutas de Plataforma Superadmin
  registerPlatformRoutes(
    app,
    platformTenantController,
    platformMetricsController,
    platformAuditController,
    platformGuard,
  );

  // 6. Registro de Rutas Protegidas por TenantGuard
  const tenantGuard = createTenantGuard(tokenService, db);

  await app.register(
    async (protectedContext) => {
      protectedContext.addHook("preHandler", tenantGuard);

      // ==========================================
      // GESTIÓN DE EQUIPO / USUARIOS DEL COMERCIO
      // ==========================================

      // 1. Listar usuarios del tenant
      protectedContext.get("/tenant/users", async (request, reply) => {
        const { tenantId, role } = (
          request as unknown as {
            tenantContext: { tenantId: string; role: string };
          }
        ).tenantContext;

        if (role !== "TENANT_ADMIN" && role !== "SUPERADMIN") {
          return reply.status(403).send({
            type: "https://api.jysoluciones.pe/errors/forbidden",
            title: "Forbidden",
            status: 403,
            detail:
              "Solo administradores pueden listar el personal del comercio.",
            instance: request.url,
          });
        }

        const users = await db
          .selectFrom("users")
          .select([
            "id",
            "full_name",
            "email",
            "role",
            "is_active",
            "must_change_password",
            "created_at",
          ])
          .where("tenant_id", "=", tenantId)
          .orderBy("created_at", "desc")
          .execute();

        const response = users.map((u) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          role: u.role,
          isActive: u.is_active,
          mustChangePassword: u.must_change_password,
          createdAt: new Date(u.created_at).toISOString(),
        }));

        return reply.status(200).send(response);
      });

      // 2. Reseteo manual de contraseña para operadores (Paso A)
      protectedContext.post<{
        Params: { userId: string };
        Body?: { temporaryPassword?: string };
      }>("/tenant/users/:userId/reset-password", async (request, reply) => {
        const { tenantId, role } = (
          request as unknown as {
            tenantContext: { tenantId: string; role: string };
          }
        ).tenantContext;

        if (role !== "TENANT_ADMIN" && role !== "SUPERADMIN") {
          return reply.status(403).send({
            type: "https://api.jysoluciones.pe/errors/forbidden",
            title: "Forbidden",
            status: 403,
            detail:
              "Solo administradores pueden asignar contraseñas provisionales.",
            instance: request.url,
          });
        }

        const { userId } = request.params;
        const body = request.body ?? {};

        // Validar que el usuario pertenezca estrictamente al tenant y no sea SUPERADMIN
        const targetUser = await db
          .selectFrom("users")
          .select(["id", "role", "is_active"])
          .where("id", "=", userId)
          .where("tenant_id", "=", tenantId)
          .executeTakeFirst();

        if (!targetUser || targetUser.role === "SUPERADMIN") {
          return reply.status(404).send({
            type: "https://api.jysoluciones.pe/errors/not-found",
            title: "Not Found",
            status: 404,
            detail: "Usuario no encontrado en este comercio.",
            instance: request.url,
          });
        }

        // Generar o usar contraseña temporal (min 8 chars)
        let tempPassword = body.temporaryPassword?.trim();
        if (!tempPassword || tempPassword.length < 8) {
          const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
          tempPassword = Array.from(
            { length: 10 },
            () => chars[Math.floor(Math.random() * chars.length)],
          ).join("");
        }

        const newHash = await passwordHasher.hash(tempPassword);

        // Actualizar credenciales, forzar cambio inicial e invalidar sesiones activas
        await db
          .updateTable("users")
          .set({
            password_hash: newHash,
            must_change_password: true,
            token_version: (eb) => eb("token_version", "+", 1),
          })
          .where("id", "=", userId)
          .execute();

        return reply.status(200).send({
          success: true,
          temporaryPassword: tempPassword,
          message:
            "Contraseña provisional asignada. El operador deberá cambiarla en su próximo acceso.",
        });
      });

      // ==========================================
      // ALMACENES / SEDES
      // ==========================================
      protectedContext.get("/warehouses", async (request, reply) => {
        const { tenantId } = (
          request as unknown as { tenantContext: { tenantId: string } }
        ).tenantContext;

        const tenant = await db
          .selectFrom("tenants")
          .select(["module_multiwarehouse"])
          .where("id", "=", tenantId)
          .executeTakeFirst();

        let query = db
          .selectFrom("warehouses")
          .select(["id", "name", "address", "is_default"])
          .where("tenant_id", "=", tenantId);

        if (!tenant?.module_multiwarehouse) {
          query = query.where("is_default", "=", true);
        }

        const list = await query
          .orderBy("is_default", "desc")
          .orderBy("name", "asc")
          .execute();

        return reply.status(200).send(
          list.map((w) => ({
            id: w.id,
            name: w.name,
            address: w.address,
            isDefault: w.is_default,
            isActive: true,
          })),
        );
      });

      // 👈 AGREGAR ESTE HANDLER:
      protectedContext.post<{
        Body: { name: string; address?: string };
      }>("/warehouses", async (request, reply) => {
        const { tenantId, role } = (
          request as unknown as {
            tenantContext: { tenantId: string; role: string };
          }
        ).tenantContext;

        if (role !== "TENANT_ADMIN" && role !== "SUPERADMIN") {
          return reply.status(403).send({
            type: "https://api.jysoluciones.pe/errors/forbidden",
            title: "Forbidden",
            status: 403,
            detail: "Solo administradores pueden registrar nuevas sedes.",
            instance: request.url,
          });
        }

        const tenant = await db
          .selectFrom("tenants")
          .select(["module_multiwarehouse"])
          .where("id", "=", tenantId)
          .executeTakeFirst();

        if (!tenant?.module_multiwarehouse) {
          return reply.status(403).send({
            type: "https://api.jysoluciones.pe/errors/forbidden",
            title: "Module Not Enabled",
            status: 403,
            detail:
              "El módulo multialmacén no se encuentra activo para su suscripción.",
            instance: request.url,
          });
        }

        const body = request.body;
        if (!body || !body.name || body.name.trim().length === 0) {
          return reply.status(422).send({
            type: "https://api.jysoluciones.pe/errors/validation-failed",
            title: "Validation Failed",
            status: 422,
            detail: "El nombre de la sede es obligatorio.",
            instance: request.url,
          });
        }

        const newWarehouseId = crypto.randomUUID();
        const trimmedName = body.name.trim();
        const trimmedAddress = body.address?.trim() || null;

        await db
          .insertInto("warehouses")
          .values({
            id: newWarehouseId,
            tenant_id: tenantId,
            name: trimmedName,
            address: trimmedAddress,
            is_default: false,
          })
          .execute();

        return reply.status(201).send({
          id: newWarehouseId,
          name: trimmedName,
          address: trimmedAddress,
          isDefault: false,
          isActive: true,
        });
      });

      // ==========================================
      // POS & TURNOS DE CAJA
      // ==========================================
      await protectedContext.register(posRoutes, {
        prefix: "/pos",
        posController,
      });

      await protectedContext.register(cashShiftRoutes, {
        prefix: "/cash-shifts",
        controller: cashShiftController,
      });

      protectedContext.get("/cash-registers", async (request, reply) => {
        const { tenantId } = (
          request as unknown as { tenantContext: { tenantId: string } }
        ).tenantContext;

        const registers = await db
          .selectFrom("cash_registers")
          .select(["id", "name", "is_active"])
          .where("tenant_id", "=", tenantId)
          .where("is_active", "=", true)
          .orderBy("name", "asc")
          .execute();

        return reply.status(200).send(registers);
      });

      // ==========================================
      // CATÁLOGO, CLIENTES, INVENTARIO Y FISCAL
      // ==========================================
      await protectedContext.register(catalogRoutes, {
        prefix: "/catalog",
        controller: catalogController,
      });

      await protectedContext.register(customerRoutes, {
        prefix: "/customers",
        customerController,
        creditController,
      });

      await protectedContext.register(inventoryRoutes, {
        prefix: "/inventory",
        controller: inventoryController,
      });

      registerFiscalRoutes(protectedContext, fiscalController, tenantGuard);
    },
    { prefix: env.API_PREFIX },
  );

  app.setNotFoundHandler((request, reply) => {
    console.log(
      "❌ [FASTIFY 404] Ruta no encontrada en el árbol:",
      request.method,
      request.url,
    );
    reply.status(404).send({
      type: "https://api.jysoluciones.pe/errors/not-found",
      title: "Route Not Found",
      status: 404,
      detail: `La ruta ${request.method} ${request.url} no existe en el enrutador.`,
      instance: request.url,
    });
  });

  return { app, pool };
}
