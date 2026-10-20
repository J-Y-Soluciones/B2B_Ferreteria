import { FastifyReply, FastifyRequest } from "fastify";
import { GetPlatformMetricsUseCase } from "../../application/use-cases/get-platform-metrics.use-case.js";

export class PlatformMetricsController {
  constructor(
    private readonly getPlatformMetricsUseCase: GetPlatformMetricsUseCase,
  ) {}

  public async getMetrics(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const metrics = await this.getPlatformMetricsUseCase.execute();
    return reply.status(200).send(metrics);
  }
}
