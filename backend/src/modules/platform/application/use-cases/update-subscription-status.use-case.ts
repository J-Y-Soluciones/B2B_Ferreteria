import { randomUUID } from "node:crypto";
import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IPlatformTenantRepository } from "../../domain/ports/platform-tenant.repository.port.js";
import { SubscriptionState } from "../../domain/value-objects/subscription-types.vo.js";
import { EntityNotFoundError } from "../../../../core/errors/domain.error.js";
import { Money } from "../../domain/value-objects/money.vo.js";

export interface UpdateSubscriptionStatusCommand {
  superadminId: string;
  ipAddress: string;
  userAgent: string;
  tenantId: string;
  status: SubscriptionState;
  reason?: string;
  newExpiresAt?: Date;
  newMonthlyFee?: number;
}

export class UpdateSubscriptionStatusUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly tenantRepo: IPlatformTenantRepository,
  ) {}

  public async execute(
    command: UpdateSubscriptionStatusCommand,
  ): Promise<void> {
    const tenant = await this.tenantRepo.findById(command.tenantId);

    if (!tenant) {
      throw new EntityNotFoundError("Tenant", command.tenantId);
    }

    const previousStatus = tenant.subscription.status;

    if (command.status === "ACTIVE") {
      // Si no especifican fecha de expiración al reactivar, asignamos 30 días desde hoy
      const defaultExpiresAt = new Date();
      defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30);

      const targetExpiresAt =
        command.newExpiresAt ??
        (tenant.subscription.expiresAt > new Date()
          ? tenant.subscription.expiresAt
          : defaultExpiresAt);

      tenant.subscription.activate(
        targetExpiresAt,
        command.newMonthlyFee !== undefined
          ? Money.from(command.newMonthlyFee)
          : tenant.subscription.monthlyFee,
      );
    } else if (command.status === "SUSPENDED") {
      tenant.subscription.suspend();
    } else if (command.status === "CANCELLED") {
      tenant.subscription.cancel();
    }

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("tenants")
        .set({
          subscription_status: tenant.subscription.status,
          monthly_fee: tenant.subscription.monthlyFee.amount.toFixed(2),
          subscription_expires_at: tenant.subscription.expiresAt,
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
          event: "SUBSCRIPTION_STATUS_CHANGED",
          ip_address: command.ipAddress,
          user_agent: command.userAgent,
          diff: JSON.stringify({
            before: { status: previousStatus },
            after: { status: tenant.subscription.status },
            reason: command.reason ?? "Actualización manual por Superadmin",
          }),
        })
        .execute();
    });
  }
}
