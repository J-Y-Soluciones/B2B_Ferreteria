// src/modules/platform/infrastructure/database/kysely-platform-metrics.repository.ts
import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IPlatformMetricsRepository } from "../../domain/ports/platform-metrics.repository.port.js";

export class KyselyPlatformMetricsRepository implements IPlatformMetricsRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async getOverviewMetrics(): Promise<any> {
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    // 1. Agregaciones sobre tenants con casteo seguro (::text para el ENUM y ::numeric para la tarifa)
    const tenantStats = await this.db
      .selectFrom("tenants")
      .select([
        (eb) => eb.fn.count("id").as("total_tenants"),

        // Conteo Activos
        sql<number>`count(case when upper(subscription_status::text) = 'ACTIVE' then 1 end)`.as(
          "active_tenants",
        ),

        // Conteo Trial
        sql<number>`count(case when upper(subscription_status::text) = 'TRIAL' then 1 end)`.as(
          "trial_tenants",
        ),

        // Trial por expirar
        sql<number>`count(case when upper(subscription_status::text) = 'TRIAL' and subscription_expires_at <= ${inSevenDays} then 1 end)`.as(
          "trial_expiring_soon",
        ),

        // Conteo Suspendidos
        sql<number>`count(case when upper(subscription_status::text) = 'SUSPENDED' then 1 end)`.as(
          "suspended_tenants",
        ),

        // MRR con casteo explícito a numeric en el ELSE y en COALESCE
        sql<number>`coalesce(sum(case when upper(subscription_status::text) = 'ACTIVE' then nullif(monthly_fee::text, '')::numeric else 0::numeric end), 0::numeric)`.as(
          "mrr_current",
        ),
      ])
      .executeTakeFirst();

    // 2. Conteo de cajas registradoras
    const registersCount = await this.db
      .selectFrom("cash_registers")
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirst();

    // 3. Conteo de usuarios
    const usersCount = await this.db
      .selectFrom("users")
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirst();

    const totalTenants = Number(tenantStats?.total_tenants ?? 0);
    const activeTenants = Number(tenantStats?.active_tenants ?? 0);
    const trialTenants = Number(tenantStats?.trial_tenants ?? 0);
    const trialExpiringSoon = Number(tenantStats?.trial_expiring_soon ?? 0);
    const suspendedTenants = Number(tenantStats?.suspended_tenants ?? 0);
    const mrrCurrent = Number(tenantStats?.mrr_current ?? 0);

    const healthPct =
      totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0;
    const avgTicket =
      activeTenants > 0
        ? Math.round((mrrCurrent / activeTenants) * 100) / 100
        : 0;
    const arrProjected = mrrCurrent * 12;

    return {
      mrr: {
        current_month_pen: mrrCurrent,
        mom_growth_pct: 0,
        arr_projected_pen: arrProjected,
      },
      tenants_count: {
        active: activeTenants,
        total: totalTenants,
        health_pct: healthPct,
        avg_ticket_pen: avgTicket,
        churn_rate_pct: 0,
      },
      trial_tenants: {
        count: trialTenants,
        expiring_soon: trialExpiringSoon,
        conversion_pct: 0,
      },
      at_risk: {
        suspended_count: suspendedTenants,
        critical_ruc: undefined,
        critical_overdue_days: 0,
      },
      global_resources: {
        pos_registers: Number(registersCount?.total ?? 0),
        users: Number(usersCount?.total ?? 0),
        req_per_min: 0,
      },
      telemetry: {
        sunat_status: "ONLINE",
        redis_latency_ms: 14,
        db_replica_lag_sec: 0,
        load_pct: 0,
        p99_latency_ms: 0,
      },
    };
  }
}
