// src/modules/platform/domain/ports/platform-metrics.repository.port.ts
export interface GlobalMetricsOverview {
  mrrProjectedPen: number;
  activeTenantsCount: number;
  trialTenantsCount: number;
  suspendedTenantsCount: number;
  tenantsAtRiskCount: number; // Por vencer en <= 7 días
  totalCashRegistersCount: number;
  totalUsersCount: number;
}

export interface IPlatformMetricsRepository {
  getOverviewMetrics(): Promise<GlobalMetricsOverview>;
}
