// src/modules/platform/application/use-cases/get-platform-metrics.use-case.ts
import { IPlatformMetricsRepository } from "../../domain/ports/platform-metrics.repository.port.js";

export class GetPlatformMetricsUseCase {
  constructor(private readonly metricsRepo: IPlatformMetricsRepository) {}

  public async execute(): Promise<any> {
    return await this.metricsRepo.getOverviewMetrics();
  }
}
