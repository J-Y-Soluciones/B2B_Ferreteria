import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import {
  IPlatformTenantRepository,
  TenantFilters,
} from "../../domain/ports/platform-tenant.repository.port.js";
import { Tenant } from "../../domain/entities/tenant.entity.js";
import { Subscription } from "../../domain/entities/subscription.entity.js";
import { Ruc } from "../../domain/value-objects/ruc.vo.js";
import { Money } from "../../domain/value-objects/money.vo.js";
import {
  PlanTier,
  SubscriptionState,
} from "../../domain/value-objects/subscription-types.vo.js";

export class KyselyPlatformTenantRepository implements IPlatformTenantRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findById(id: string): Promise<Tenant | null> {
    const row = await this.db
      .selectFrom("tenants")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapToDomain(row);
  }

  public async findByRuc(ruc: string): Promise<Tenant | null> {
    const row = await this.db
      .selectFrom("tenants")
      .selectAll()
      .where("ruc", "=", ruc)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapToDomain(row);
  }

  public async findAll(
    filters: TenantFilters,
  ): Promise<{ tenants: Tenant[]; total: number }> {
    let query = this.db.selectFrom("tenants").selectAll();

    if (filters.status) {
      query = query.where("subscription_status", "=", filters.status);
    }

    if (filters.searchTerm) {
      const term = `%${filters.searchTerm.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("business_name", "ilike", term),
          eb("trade_name", "ilike", term),
          eb("ruc", "like", term),
        ]),
      );
    }

    const rows = await query
      .limit(filters.limit ?? 20)
      .offset(filters.offset ?? 0)
      .orderBy("created_at", "desc")
      .execute();

    // Conteo total para paginación
    const countRow = await this.db
      .selectFrom("tenants")
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirst();

    return {
      tenants: rows.map((r) => this.mapToDomain(r)),
      total: Number(countRow?.total ?? 0),
    };
  }

  public async save(tenant: Tenant): Promise<void> {
    await this.db
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
        module_sunat: tenant.moduleSunat,
        module_credits: tenant.moduleCredits,
        module_multiwarehouse: tenant.moduleMultiwarehouse,
        max_cash_registers: tenant.maxCashRegisters,
        max_users: tenant.maxUsers,
        allow_negative_stock: tenant.allowNegativeStock,
      })
      .execute();
  }

  public async update(tenant: Tenant): Promise<void> {
    await this.db
      .updateTable("tenants")
      .set({
        business_name: tenant.businessName,
        trade_name: tenant.tradeName,
        subscription_status: tenant.subscription.status,
        plan_name: tenant.subscription.planName,
        monthly_fee: tenant.subscription.monthlyFee.amount.toFixed(2),
        subscription_expires_at: tenant.subscription.expiresAt,
        grace_period_days: tenant.subscription.gracePeriodDays,
        module_sunat: tenant.moduleSunat,
        module_credits: tenant.moduleCredits,
        module_multiwarehouse: tenant.moduleMultiwarehouse,
        max_cash_registers: tenant.maxCashRegisters,
        max_users: tenant.maxUsers,
        allow_negative_stock: tenant.allowNegativeStock,
      })
      .where("id", "=", tenant.id)
      .execute();
  }

  private mapToDomain(row: any): Tenant {
    const subscription = Subscription.create({
      planName: row.plan_name as PlanTier,
      status: row.subscription_status as SubscriptionState,
      monthlyFee: Money.from(row.monthly_fee),
      expiresAt: new Date(row.subscription_expires_at),
      gracePeriodDays: row.grace_period_days,
    });

    return Tenant.reconstitute({
      id: row.id,
      businessName: row.business_name,
      tradeName: row.trade_name,
      ruc: Ruc.create(row.ruc),
      profile: row.profile,
      subscription,
      moduleSunat: row.module_sunat,
      moduleCredits: row.module_credits,
      moduleMultiwarehouse: row.module_multiwarehouse,
      maxCashRegisters: row.max_cash_registers,
      maxUsers: row.max_users,
      allowNegativeStock: row.allow_negative_stock,
      createdAt: new Date(row.created_at),
    });
  }
}
