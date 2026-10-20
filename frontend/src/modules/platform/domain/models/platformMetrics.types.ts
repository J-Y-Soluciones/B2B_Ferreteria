export interface PlatformSystemTelemetry {
  readonly sunatStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  readonly redisLatencyMs: number;
  readonly databaseReplicaLagSec: number;
  readonly globalLoadPercentage: number;
  readonly globalP99LatencyMs: number;
}

export interface PlatformMetrics {
  readonly mrr: {
    readonly currentMonthPen: number;
    readonly monthOverMonthGrowthPct: number;
    readonly arrProjectedPen: number;
  };
  readonly tenantsCount: {
    readonly active: number;
    readonly total: number;
    readonly healthPercentage: number;
    readonly averageTicketPen: number;
    readonly churnRatePct: number;
  };
  readonly trialTenants: {
    readonly count: number;
    readonly expiringWithin7Days: number;
    readonly estimatedConversionPct: number;
  };
  readonly atRiskTenants: {
    readonly suspendedCount: number;
    readonly criticalTenantRuc?: string;
    readonly criticalDaysOverdue?: number;
  };
  readonly globalResources: {
    readonly totalPosRegisters: number;
    readonly totalUsers: number;
    readonly requestsPerMinute: number;
  };
  readonly telemetry: PlatformSystemTelemetry;
}
