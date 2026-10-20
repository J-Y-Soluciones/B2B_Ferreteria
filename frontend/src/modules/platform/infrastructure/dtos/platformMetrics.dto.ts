import type { PlatformMetrics } from "../../domain/models/platformMetrics.types";

export interface PlatformMetricsBackendDto {
  mrr?: {
    current_month_pen?: number | string;
    mom_growth_pct?: number | string;
    arr_projected_pen?: number | string;
  };
  tenants_count?: {
    active?: number;
    total?: number;
    health_pct?: number;
    avg_ticket_pen?: number | string;
    churn_rate_pct?: number | string;
  };
  trial_tenants?: {
    count?: number;
    expiring_soon?: number;
    conversion_pct?: number | string;
  };
  at_risk?: {
    suspended_count?: number;
    critical_ruc?: string;
    critical_overdue_days?: number;
  };
  global_resources?: {
    pos_registers?: number;
    users?: number;
    req_per_min?: number;
  };
  telemetry?: {
    sunat_status?: "ONLINE" | "DEGRADED" | "OFFLINE";
    redis_latency_ms?: number;
    db_replica_lag_sec?: number;
    load_pct?: number;
    p99_latency_ms?: number;
  };
}

export class PlatformMetricsMapper {
  static toDomain(dto: PlatformMetricsBackendDto): PlatformMetrics {
    return {
      mrr: {
        currentMonthPen: Number(dto.mrr?.current_month_pen ?? 0),
        monthOverMonthGrowthPct: Number(dto.mrr?.mom_growth_pct ?? 0),
        arrProjectedPen: Number(dto.mrr?.arr_projected_pen ?? 0),
      },
      tenantsCount: {
        active: dto.tenants_count?.active ?? 0,
        total: dto.tenants_count?.total ?? 0,
        healthPercentage: Number(dto.tenants_count?.health_pct ?? 0),
        averageTicketPen: Number(dto.tenants_count?.avg_ticket_pen ?? 0),
        churnRatePct: Number(dto.tenants_count?.churn_rate_pct ?? 0),
      },
      trialTenants: {
        count: dto.trial_tenants?.count ?? 0,
        expiringWithin7Days: dto.trial_tenants?.expiring_soon ?? 0,
        estimatedConversionPct: Number(dto.trial_tenants?.conversion_pct ?? 0),
      },
      atRiskTenants: {
        suspendedCount: dto.at_risk?.suspended_count ?? 0,
        criticalTenantRuc: dto.at_risk?.critical_ruc,
        criticalDaysOverdue: dto.at_risk?.critical_overdue_days,
      },
      globalResources: {
        totalPosRegisters: dto.global_resources?.pos_registers ?? 0,
        totalUsers: dto.global_resources?.users ?? 0,
        requestsPerMinute: dto.global_resources?.req_per_min ?? 0,
      },
      telemetry: {
        sunatStatus: dto.telemetry?.sunat_status ?? "ONLINE",
        redisLatencyMs: dto.telemetry?.redis_latency_ms ?? 0,
        databaseReplicaLagSec: dto.telemetry?.db_replica_lag_sec ?? 0,
        globalLoadPercentage: dto.telemetry?.load_pct ?? 0,
        globalP99LatencyMs: dto.telemetry?.p99_latency_ms ?? 0,
      },
    };
  }
}
