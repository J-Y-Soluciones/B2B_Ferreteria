import { FastifyReply, FastifyRequest } from "fastify";
import { ITokenService } from "../../../modules/identity/domain/security.interfaces.js";

declare module "fastify" {
  interface FastifyRequest {
    platformContext?: {
      superadminId: string;
      email?: string;
      role: string;
      impersonatedTenantId?: string;
    };
  }
}

export function createPlatformGuard(tokenService: ITokenService) {
  return async function platformGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        type: "https://api.jysoluciones.pe/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail:
          "Se requiere un token Bearer válido para acceder al módulo de Plataforma.",
        instance: request.url,
      });
    }

    const token = authHeader.substring(7);

    try {
      const claims = await tokenService.verifyAccessToken(token);

      if (claims.role !== "SUPERADMIN") {
        return reply.status(403).send({
          type: "https://api.jysoluciones.pe/errors/forbidden",
          title: "Forbidden Access",
          status: 403,
          detail:
            "El recurso solicitado requiere permisos globales de SUPERADMIN.",
          instance: request.url,
        });
      }

      // Permite opcionalmente leer X-Tenant-Id para soporte/auditoría
      const impersonatedTenantId = request.headers["x-tenant-id"] as
        | string
        | undefined;

      request.platformContext = {
        superadminId: claims.sub,
        role: claims.role,
        impersonatedTenantId,
      };
    } catch {
      return reply.status(401).send({
        type: "https://api.jysoluciones.pe/errors/invalid-token",
        title: "Invalid Access Token",
        status: 401,
        detail: "El token de acceso proporcionado ha expirado o es inválido.",
        instance: request.url,
      });
    }
  };
}
