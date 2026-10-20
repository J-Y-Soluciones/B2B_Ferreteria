import { describe, it, expect, vi } from "vitest";
import { GetPlatformMetricsUseCase } from "../use-cases/get-platform-metrics.use-case.js";
import { IPlatformMetricsRepository } from "../../domain/ports/platform-metrics.repository.port.js";

describe("GetPlatformMetricsUseCase", () => {
  it("debe retornar y redondear correctamente las métricas agregadas", async () => {
    const mockMetricsRepo: IPlatformMetricsRepository = {
      getOverviewMetrics: vi.fn().mockResolvedValue({
        mrrProjectedPen: 18450.456,
        activeTenantsCount: 42,
        trialTenantsCount: 3,
        suspendedTenantsCount: 1,
        tenantsAtRiskCount: 3,
        totalCashRegistersCount: 68,
        totalUsersCount: 124,
      }),
    };

    const useCase = new GetPlatformMetricsUseCase(mockMetricsRepo);
    const result = await useCase.execute();

    expect(result.mrrProjectedPen).toBe(18450.46); // Redondeo a 2 decimales
    expect(result.tenants.total).toBe(46); // 42 + 3 + 1
    expect(result.tenants.active).toBe(42);
    expect(result.tenants.trial).toBe(3);
    expect(result.tenants.suspended).toBe(1);
    expect(result.tenants.atRiskNext7Days).toBe(3);
    expect(result.infrastructure.totalCashRegisters).toBe(68);
    expect(result.infrastructure.totalUsers).toBe(124);
    expect(result.generatedAt).toBeDefined();
  });
});
