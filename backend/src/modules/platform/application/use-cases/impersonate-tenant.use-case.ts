// src/modules/platform/application/use-cases/impersonate-tenant.use-case.ts
import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IPlatformTenantRepository } from "../../domain/ports/platform-tenant.repository.port.js";
import { IUserRepository } from "../../../identity/domain/identity.repository.interface.js";
import { ITokenService } from "../../../identity/domain/security.interfaces.js";
import {
  EntityNotFoundError,
  DomainValidationError,
} from "../../../../core/errors/domain.error.js";

export interface ImpersonateTenantCommand {
  superadminId: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
}

export interface ImpersonateTenantResult {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "TENANT_ADMIN";
  };
  tenant: {
    id: string;
    tradeName: string;
    profile: "HARDWARE_STORE" | "LUBRICENTER";
  };
}

export class ImpersonateTenantUseCase {
  constructor(
    private readonly tenantRepo: IPlatformTenantRepository,
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly db: Kysely<DatabaseSchema>,
  ) {}

  public async execute(
    command: ImpersonateTenantCommand,
  ): Promise<ImpersonateTenantResult> {
    // 1. Validar que el tenant exista
    const tenant = await this.tenantRepo.findById(command.tenantId);
    if (!tenant) {
      throw new EntityNotFoundError("Tenant", command.tenantId);
    }

    // 2. Obtener el usuario administrador principal del tenant (TENANT_ADMIN)
    const adminUser = await this.userRepo.findPrimaryAdminByTenantId(
      command.tenantId,
    );
    if (!adminUser) {
      throw new DomainValidationError(
        `El comercio ${tenant.tradeName || tenant.businessName} no cuenta con un usuario administrador activo asignado.`,
      );
    }

    // 3. Emitir JWT efímero con claims de impersonación
    const accessToken = await this.tokenService.signAccessToken({
      sub: adminUser.id,
      tenant_id: tenant.id,
      role: "TENANT_ADMIN",
      token_version: adminUser.tokenVersion,
      is_impersonated: true,
      impersonated_by: command.superadminId,
    });

    // 4. Registrar auditoría inmutable en platform_audit_logs
    await this.db
      .insertInto("platform_audit_logs")
      .values({
        id: randomUUID(),
        superadmin_id: command.superadminId,
        tenant_id: tenant.id,
        event: "TENANT_IMPERSONATED",
        ip_address: command.ipAddress,
        user_agent: command.userAgent,
        diff: {
          action: "IMPERSONATION_STARTED",
          target_user_id: adminUser.id,
          target_email: adminUser.email, // 👈 Corregido: es string directo
          target_role: "TENANT_ADMIN",
        },
      })
      .execute();

    // 5. Retornar payload estricto solicitado
    return {
      accessToken,
      user: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        email: adminUser.email, // 👈 Corregido: es string directo
        role: "TENANT_ADMIN",
      },
      tenant: {
        id: tenant.id,
        tradeName: tenant.tradeName || tenant.businessName,
        profile: tenant.profile,
      },
    };
  }
}
