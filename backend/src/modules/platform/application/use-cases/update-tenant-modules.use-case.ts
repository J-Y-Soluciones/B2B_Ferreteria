import { randomUUID } from "node:crypto";
import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IPlatformTenantRepository } from "../../domain/ports/platform-tenant.repository.port.js";
import { EntityNotFoundError } from "../../../../core/errors/domain.error.js";

export interface UpdateTenantModulesCommand {
  superadminId: string;
  ipAddress: string;
  userAgent: string;
  tenantId: string;
  moduleSunat?: boolean;
  moduleCredits?: boolean;
  moduleMultiwarehouse?: boolean;
  maxCashRegisters?: number;
  maxUsers?: number;
  allowNegativeStock?: boolean;
}

export class UpdateTenantModulesUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly tenantRepo: IPlatformTenantRepository,
  ) {}

  public async execute(command: UpdateTenantModulesCommand): Promise<void> {
    const tenant = await this.tenantRepo.findById(command.tenantId);

    if (!tenant) {
      throw new EntityNotFoundError("Tenant", command.tenantId);
    }

    const beforeState = {
      moduleSunat: tenant.moduleSunat,
      moduleCredits: tenant.moduleCredits,
      moduleMultiwarehouse: tenant.moduleMultiwarehouse,
      maxCashRegisters: tenant.maxCashRegisters,
      maxUsers: tenant.maxUsers,
      allowNegativeStock: tenant.allowNegativeStock,
    };

    tenant.updateModules({
      sunat: command.moduleSunat,
      credits: command.moduleCredits,
      multiwarehouse: command.moduleMultiwarehouse,
      maxRegisters: command.maxCashRegisters,
      maxUsers: command.maxUsers,
    });

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("tenants")
        .set({
          module_sunat: tenant.moduleSunat,
          module_credits: tenant.moduleCredits,
          module_multiwarehouse: tenant.moduleMultiwarehouse,
          max_cash_registers: tenant.maxCashRegisters,
          max_users: tenant.maxUsers,
          allow_negative_stock:
            command.allowNegativeStock ?? tenant.allowNegativeStock,
          updated_at: new Date(),
        })
        .where("id", "=", tenant.id)
        .execute();

      await trx
        .insertInto("platform_audit_logs")
        .values({
          id: randomUUID(),
          superadmin_id: command.superadminId,
          tenant_id: tenant.id,
          event: "MODULES_UPDATED",
          ip_address: command.ipAddress,
          user_agent: command.userAgent,
          diff: JSON.stringify({
            before: beforeState,
            after: {
              moduleSunat: tenant.moduleSunat,
              moduleCredits: tenant.moduleCredits,
              moduleMultiwarehouse: tenant.moduleMultiwarehouse,
              maxCashRegisters: tenant.maxCashRegisters,
              maxUsers: tenant.maxUsers,
              allowNegativeStock:
                command.allowNegativeStock ?? tenant.allowNegativeStock,
            },
          }),
        })
        .execute();
    });
  }
}
