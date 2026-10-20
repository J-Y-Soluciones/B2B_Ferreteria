// src/modules/platform/application/use-cases/update-tenant-full.use-case.ts
import { Kysely, sql } from "kysely";
import { randomUUID } from "node:crypto";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IPlatformTenantRepository } from "../../domain/ports/platform-tenant.repository.port.js";
import { UpdateTenantFullInput } from "../../presentation/schemas/platform-tenant.schemas.js";

export interface UpdateTenantFullCommand extends UpdateTenantFullInput {
  tenantId: string;
  superadminId: string;
  ipAddress: string;
  userAgent: string;
}

export class UpdateTenantFullUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly tenantRepo: IPlatformTenantRepository,
  ) {}

  public async execute(command: UpdateTenantFullCommand): Promise<any> {
    const existing = await this.tenantRepo.findById(command.tenantId);
    if (!existing) {
      throw new Error(`Comercio con ID '${command.tenantId}' no encontrado.`);
    }

    const diff: Record<string, { before: any; after: any }> = {};
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    // 1. Datos Generales
    if (
      command.businessName &&
      command.businessName !== existing.businessName
    ) {
      diff["businessName"] = {
        before: existing.businessName,
        after: command.businessName,
      };
      updateData.business_name = command.businessName.trim();
    }
    if (command.tradeName && command.tradeName !== existing.tradeName) {
      diff["tradeName"] = {
        before: existing.tradeName,
        after: command.tradeName,
      };
      updateData.trade_name = command.tradeName.trim();
    }
    if (command.profile && command.profile !== existing.profile) {
      diff["profile"] = { before: existing.profile, after: command.profile };
      updateData.profile = command.profile;
    }

    // 2. Límites y Plan (Omitiendo dueDay ya que se gestiona mediante fecha de expiración)
    if (command.plan) {
      if (
        command.plan.maxCashRegisters !== undefined &&
        command.plan.maxCashRegisters !== existing.maxCashRegisters
      ) {
        diff["maxCashRegisters"] = {
          before: existing.maxCashRegisters,
          after: command.plan.maxCashRegisters,
        };
        updateData.max_cash_registers = command.plan.maxCashRegisters;
      }

      if (
        command.plan.maxUsers !== undefined &&
        command.plan.maxUsers !== existing.maxUsers
      ) {
        diff["maxUsers"] = {
          before: existing.maxUsers,
          after: command.plan.maxUsers,
        };
        updateData.max_users = command.plan.maxUsers;
      }

      const currentStatus = existing.subscription?.status;
      if (
        command.plan.subscriptionStatus &&
        command.plan.subscriptionStatus !== currentStatus
      ) {
        diff["subscriptionStatus"] = {
          before: currentStatus,
          after: command.plan.subscriptionStatus,
        };
        updateData.subscription_status = command.plan.subscriptionStatus;
      }

      if (command.plan.monthlyFee !== undefined) {
        const currentFee =
          typeof existing.subscription?.monthlyFee?.amount === "number"
            ? existing.subscription.monthlyFee.amount
            : Number(existing.subscription?.monthlyFee ?? 0);

        if (command.plan.monthlyFee !== currentFee) {
          diff["monthlyFee"] = {
            before: currentFee,
            after: command.plan.monthlyFee,
          };
          updateData.monthly_fee = Number(command.plan.monthlyFee).toFixed(2);
        }
      }
    }

    // 3. Módulos
    if (
      command.modules ||
      (command as any).allow_negative_stock !== undefined ||
      (command as any).allowNegativeStock !== undefined
    ) {
      if (
        command.modules?.moduleSunat !== undefined &&
        command.modules.moduleSunat !== existing.moduleSunat
      ) {
        diff["moduleSunat"] = {
          before: existing.moduleSunat,
          after: command.modules.moduleSunat,
        };
        updateData.module_sunat = command.modules.moduleSunat;
      }

      if (
        command.modules?.moduleCredits !== undefined &&
        command.modules.moduleCredits !== existing.moduleCredits
      ) {
        diff["moduleCredits"] = {
          before: existing.moduleCredits,
          after: command.modules.moduleCredits,
        };
        updateData.module_credits = command.modules.moduleCredits;
      }

      if (
        command.modules?.moduleMultiwarehouse !== undefined &&
        command.modules.moduleMultiwarehouse !== existing.moduleMultiwarehouse
      ) {
        diff["moduleMultiwarehouse"] = {
          before: existing.moduleMultiwarehouse,
          after: command.modules.moduleMultiwarehouse,
        };
        updateData.module_multiwarehouse = command.modules.moduleMultiwarehouse;
      }

      // Extracción tolerante (camelCase, snake_case, anidado en modules o en la raíz)
      const targetNegativeStock =
        command.modules?.allowNegativeStock ??
        (command.modules as any)?.allow_negative_stock ??
        (command as any)?.allowNegativeStock ??
        (command as any)?.allow_negative_stock;

      if (
        targetNegativeStock !== undefined &&
        targetNegativeStock !== existing.allowNegativeStock
      ) {
        diff["allowNegativeStock"] = {
          before: existing.allowNegativeStock,
          after: targetNegativeStock,
        };
        updateData.allow_negative_stock = Boolean(targetNegativeStock);
      }
    }

    // 4. Transacción Atómica
    await this.db.transaction().execute(async (trx) => {
      // Solo actualizamos si hay campos reales a modificar
      if (Object.keys(updateData).length > 1) {
        await trx
          .updateTable("tenants")
          .set(updateData)
          .where("id", "=", command.tenantId)
          .execute();
      }

      // Registro de Auditoría si hubo cambios
      if (Object.keys(diff).length > 0) {
        await trx
          .insertInto("platform_audit_logs")
          .values({
            id: randomUUID(),
            superadmin_id: command.superadminId,
            tenant_id: command.tenantId,
            event: "MODULES_UPDATED",
            ip_address: command.ipAddress,
            user_agent: command.userAgent,
            diff: sql`${JSON.stringify(diff)}::jsonb` as any, // 👈 Casteo explícito a jsonb
          })
          .execute();
      }
    });

    // 5. Retornar DTO plano compatible con la respuesta esperada por Frontend
    const updated = await this.db
      .selectFrom("tenants")
      .selectAll()
      .where("id", "=", command.tenantId)
      .executeTakeFirstOrThrow();

    return {
      id: updated.id,
      business_name: updated.business_name,
      trade_name: updated.trade_name,
      ruc: updated.ruc,
      profile: updated.profile,
      subscription_status: updated.subscription_status,
      plan_name: updated.plan_name,
      monthly_fee: Number(updated.monthly_fee),
      subscription_expires_at: updated.subscription_expires_at
        ? new Date(updated.subscription_expires_at).toISOString()
        : null,
      grace_period_days: updated.grace_period_days,
      module_sunat: updated.module_sunat,
      module_credits: updated.module_credits,
      module_multiwarehouse: updated.module_multiwarehouse,
      allow_negative_stock: updated.allow_negative_stock,
      max_cash_registers: updated.max_cash_registers,
      max_users: updated.max_users,
      created_at: new Date(updated.created_at).toISOString(),
    };
  }
}
