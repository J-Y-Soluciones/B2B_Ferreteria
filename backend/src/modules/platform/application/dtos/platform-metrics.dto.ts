export interface PlatformMetricsResult {
  mrrProjectedPen: number;
  tenants: {
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
    total: number;
    atRiskNext7Days: number;
  };
  infrastructure: {
    totalCashRegisters: number;
    totalUsers: number;
  };
  generatedAt: string;
}
