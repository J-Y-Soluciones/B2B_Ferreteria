// src/shared/infrastructure/http/tenant-guard.middleware.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { Kysely } from "kysely";
import { DatabaseSchema } from "../database/database.types.js";
import { ITokenService } from "../../../modules/identity/domain/security.interfaces.js";
import { TenantMismatchError } from "../../../modules/identity/domain/identity.errors.js";

export interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    tenantContext: AuthenticatedTenantContext;
  }
}

export const createTenantGuard = (
  tokenService: ITokenService,
  db: Kysely<DatabaseSchema>,
) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    // 1. Verificación perimetral de cabecera Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      reply.status(401).send({
        type: "https://api.jysoluciones.pe/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Falta cabecera Authorization Bearer token válida.",
        instance: request.url,
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      // 2. Verificación criptográfica del token
      const claims = await tokenService.verifyAccessToken(token);

      // 3. Resolución segura del tenantId (Header o cualquiera de las variantes de claim en JWT)
      const headerTenantId = request.headers["x-tenant-id"] as
        | string
        | undefined;
      const tokenTenantId = (claims.tenant_id || (claims as any).tenantId) as
        | string
        | undefined;

      const effectiveTenantId = headerTenantId || tokenTenantId;

      if (!effectiveTenantId) {
        reply.status(400).send({
          type: "https://api.jysoluciones.pe/errors/bad-request",
          title: "Missing Tenant Identifier",
          status: 400,
          detail:
            "La cabecera X-Tenant-Id o el claim de tenant en el token es obligatorio.",
          instance: request.url,
        });
        return;
      }

      // Si es SUPERADMIN, permitimos bypass de tenant mismatch para auditar o dar soporte
      const isSuperadmin = claims.role === "SUPERADMIN";

      if (
        !isSuperadmin &&
        headerTenantId &&
        claims.tenant_id !== headerTenantId
      ) {
        throw new TenantMismatchError();
      }

      // 4. Verificación de existencia, estado de suscripción y periodo de gracia en DB
      const tenant = await db
        .selectFrom("tenants")
        .select([
          "id",
          "subscription_status",
          "subscription_expires_at",
          "grace_period_days",
        ])
        .where("id", "=", effectiveTenantId)
        .executeTakeFirst();

      if (!tenant) {
        reply.status(404).send({
          type: "https://api.jysoluciones.pe/errors/tenant-not-found",
          title: "Tenant Not Found",
          status: 404,
          detail: "El comercio especificado no existe.",
          instance: request.url,
        });
        return;
      }

      // Los SUPERADMIN pueden ingresar en modo soporte incluso si está suspendido
      if (!isSuperadmin) {
        const now = new Date();
        const graceCutoff = new Date(tenant.subscription_expires_at);
        graceCutoff.setDate(graceCutoff.getDate() + tenant.grace_period_days);

        if (
          tenant.subscription_status === "SUSPENDED" ||
          tenant.subscription_status === "CANCELLED" ||
          now > graceCutoff
        ) {
          reply.status(403).send({
            type: "https://api.jysoluciones.pe/errors/tenant-suspended",
            title: "Tenant Access Suspended",
            status: 403,
            detail:
              "El acceso a la plataforma se encuentra temporalmente suspendido debido al estado de la suscripción o vencimiento del periodo de gracia.",
            instance: request.url,
          });
          return;
        }
      }

      // 5. Inyección del contexto autenticado en el request
      request.tenantContext = {
        tenantId: effectiveTenantId,
        userId: claims.sub,
        role: claims.role,
      };
    } catch (err: unknown) {
      if (err instanceof TenantMismatchError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
        });
        return;
      }

      reply.status(401).send({
        type: "https://api.jysoluciones.pe/errors/unauthorized",
        title: "Invalid Token",
        status: 401,
        detail: "El token provisto es inválido o ha expirado.",
        instance: request.url,
      });
    }
  };
};
