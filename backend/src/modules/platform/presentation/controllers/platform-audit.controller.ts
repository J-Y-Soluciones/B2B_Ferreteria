import { FastifyReply, FastifyRequest } from "fastify";
import { ListAuditLogsUseCase } from "../../application/use-cases/list-audit-logs.use-case.js";
import { listAuditLogsQuerySchema } from "../schemas/platform-audit.schemas.js";

export class PlatformAuditController {
  constructor(private readonly listAuditLogsUseCase: ListAuditLogsUseCase) {}

  public async listLogs(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const query = listAuditLogsQuerySchema.parse(request.query);

    const result = await this.listAuditLogsUseCase.execute({
      tenantId: query.tenant_id,
      superadminId: query.superadmin_id,
      event: query.event,
      limit: query.limit,
      offset: query.offset,
    });

    reply.status(200).send({
      data: result.data,
      pagination: {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
      },
    });
  }
}
