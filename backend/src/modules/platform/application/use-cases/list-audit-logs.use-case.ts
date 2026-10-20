import {
  PlatformAuditEvent,
  PlatformAuditLog,
} from "../../domain/entities/platform-audit-log.entity.js";
import { KyselyPlatformAuditRepository } from "../../infrastructure/database/kysely-platform-audit.repository.js";

export interface ListAuditLogsQuery {
  tenantId?: string;
  superadminId?: string;
  event?: PlatformAuditEvent;
  limit?: number;
  offset?: number;
}

export interface AuditLogDto {
  id: string;
  superadminId: string;
  tenantId: string | null;
  event: string;
  ipAddress: string;
  userAgent: string;
  diff: Record<string, unknown>;
  createdAt: string;
}

export class ListAuditLogsUseCase {
  constructor(private readonly auditRepo: KyselyPlatformAuditRepository) {}

  public async execute(
    query: ListAuditLogsQuery,
  ): Promise<{ data: AuditLogDto[]; total: number }> {
    const { logs, total } = await this.auditRepo.findAll({
      tenantId: query.tenantId,
      superadminId: query.superadminId,
      event: query.event,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: logs.map((log) => ({
        id: log.id,
        superadminId: log.superadminId,
        tenantId: log.tenantId,
        event: log.event,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        diff: log.diff as Record<string, unknown>,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
    };
  }
}
