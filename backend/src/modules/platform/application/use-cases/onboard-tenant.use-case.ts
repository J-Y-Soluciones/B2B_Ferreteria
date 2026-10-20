// src/modules/platform/application/use-cases/onboard-tenant.use-case.ts
import { randomUUID } from "node:crypto";
import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import {
  OnboardTenantCommand,
  OnboardTenantResult,
} from "../dtos/onboard-tenant.dto.js";
import { Tenant } from "../../domain/entities/tenant.entity.js";
import { Ruc } from "../../domain/value-objects/ruc.vo.js";
import { Email } from "../../domain/value-objects/email.vo.js";
import { IPasswordHasher } from "../../../identity/domain/security.interfaces.js";
import { DomainValidationError } from "../../../../core/errors/domain.error.js";
import { IEmailService } from "../../../../shared/domain/ports/email-service.port.js";
import { PlanTier } from "../../domain/value-objects/subscription-types.vo.js";

export class OnboardTenantUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailService?: IEmailService,
  ) {}

  public async execute(
    command: OnboardTenantCommand,
  ): Promise<OnboardTenantResult> {
    const validRuc = Ruc.create(command.ruc);
    const validEmail = Email.create(command.adminEmail);

    return await this.db.transaction().execute(async (trx) => {
      // 1. Verificar unicidad de RUC
      const existingRuc = await trx
        .selectFrom("tenants")
        .select("id")
        .where("ruc", "=", validRuc.value)
        .executeTakeFirst();

      if (existingRuc) {
        throw new DomainValidationError(
          `Ya existe un comercio registrado con el RUC ${validRuc.value}.`,
          [
            {
              name: "ruc",
              reason: "El RUC ya se encuentra en uso por otra cuenta.",
            },
          ],
        );
      }

      // 2. Verificar unicidad de Email del Administrador
      const existingEmail = await trx
        .selectFrom("users")
        .select("id")
        .where("email", "=", validEmail.value)
        .executeTakeFirst();

      if (existingEmail) {
        throw new DomainValidationError(
          `La dirección de correo ${validEmail.value} ya está registrada en la plataforma.`,
          [
            {
              name: "admin_email",
              reason: "El correo electrónico ya se encuentra registrado.",
            },
          ],
        );
      }

      // 3. Crear Agregado Tenant y sobreescribir flags con los valores seleccionados en el formulario
      const tenantId = randomUUID();
      const tenant = Tenant.create(
        tenantId,
        command.businessName.trim(),
        command.tradeName?.trim() ?? command.businessName.trim(),
        validRuc,
        command.profile,
        (command.planName as PlanTier) ?? "PRO", // 👈 Casteo tipado a PlanTier
      );

      const moduleSunat = command.moduleSunat ?? tenant.moduleSunat;
      const moduleCredits = command.moduleCredits ?? tenant.moduleCredits;
      const moduleMultiwarehouse =
        command.moduleMultiwarehouse ?? tenant.moduleMultiwarehouse;
      const allowNegativeStock =
        command.allowNegativeStock ?? tenant.allowNegativeStock;

      await trx
        .insertInto("tenants")
        .values({
          id: tenant.id,
          business_name: tenant.businessName,
          trade_name: tenant.tradeName,
          ruc: tenant.ruc.value,
          profile: tenant.profile,
          subscription_status: tenant.subscription.status,
          plan_name: tenant.subscription.planName,
          monthly_fee: tenant.subscription.monthlyFee.amount.toFixed(2),
          subscription_expires_at: tenant.subscription.expiresAt,
          grace_period_days: tenant.subscription.gracePeriodDays,
          module_sunat: moduleSunat,
          module_credits: moduleCredits,
          module_multiwarehouse: moduleMultiwarehouse,
          max_cash_registers: tenant.maxCashRegisters,
          max_users: tenant.maxUsers,
          allow_negative_stock: allowNegativeStock,
        })
        .execute();

      // 4. Crear Almacén por Defecto Activo
      const warehouseId = randomUUID();
      await trx
        .insertInto("warehouses")
        .values({
          id: warehouseId,
          tenant_id: tenant.id,
          name: command.warehouseName?.trim() || "Almacén Principal / Tienda",
          address: command.warehouseAddress?.trim() || null,
          is_default: true,
        })
        .execute();

      // 5. Crear Caja Registradora 01
      const cashRegisterId = randomUUID();
      await trx
        .insertInto("cash_registers")
        .values({
          id: cashRegisterId,
          tenant_id: tenant.id,
          name: command.cashRegisterName?.trim() || "Caja Mostrador 01",
          is_active: true,
        })
        .execute();

      // 6. Determinar contraseña temporal (la enviada o generada) y hashear
      let effectivePassword = command.adminPasswordPlain?.trim();
      if (!effectivePassword || effectivePassword.length < 8) {
        const chars =
          "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
        effectivePassword = Array.from(
          { length: 10 },
          () => chars[Math.floor(Math.random() * chars.length)],
        ).join("");
      }

      const passwordHash = await this.passwordHasher.hash(effectivePassword);
      const adminUserId = randomUUID();

      await trx
        .insertInto("users")
        .values({
          id: adminUserId,
          tenant_id: tenant.id,
          email: validEmail.value,
          password_hash: passwordHash,
          full_name: command.adminFullName.trim(),
          role: "TENANT_ADMIN",
          token_version: 1,
          is_active: !command.sendInvitationEmail,
          must_change_password: true,
        })
        .execute();

      // 7. Auditoría
      await trx
        .insertInto("platform_audit_logs")
        .values({
          id: randomUUID(),
          superadmin_id: command.superadminId,
          tenant_id: tenant.id,
          event: "TENANT_CREATED",
          ip_address: command.ipAddress,
          user_agent: command.userAgent,
          diff: JSON.stringify({
            tenant: {
              id: tenant.id,
              businessName: tenant.businessName,
              ruc: tenant.ruc.value,
              plan: tenant.subscription.planName,
            },
            adminUser: {
              id: adminUserId,
              email: validEmail.value,
            },
          }),
        })
        .execute();

      return {
        tenantId: tenant.id,
        businessName: tenant.businessName,
        ruc: tenant.ruc.value,
        planName: tenant.subscription.planName,
        subscriptionStatus: tenant.subscription.status,
        adminUserId,
        adminEmail: validEmail.value,
        temporaryPassword: effectivePassword, // 👈 Se devuelve la contraseña exacta
        defaultWarehouseId: warehouseId,
        defaultCashRegisterId: cashRegisterId,
        createdAt: tenant.createdAt.toISOString(),
      };
    });
  }
}
