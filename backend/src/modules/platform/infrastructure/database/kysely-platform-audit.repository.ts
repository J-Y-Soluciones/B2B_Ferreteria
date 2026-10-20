import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IPlatformAuditRepository } from "../../domain/ports/platform-audit.repository.port.js";
import {
  AuditDiffPayload,
  PlatformAuditEvent,
  PlatformAuditLog,
} from "../../domain/entities/platform-audit-log.entity.js";

export interface AuditLogFilters {
  tenantId?: string;
  superadminId?: string;
  event?: PlatformAuditEvent;
  limit?: number;
  offset?: number;
}

export class KyselyPlatformAuditRepository implements IPlatformAuditRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async append(log: PlatformAuditLog): Promise<void> {
    await this.db
      .insertInto("platform_audit_logs")
      .values({
        id: log.id,
        superadmin_id: log.superadminId,
        tenant_id: log.tenantId,
        event: log.event,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        diff: JSON.stringify(log.diff),
      })
      .execute();
  }

  public async findAll(
    filters: AuditLogFilters,
  ): Promise<{ logs: PlatformAuditLog[]; total: number }> {
    let query = this.db.selectFrom("platform_audit_logs").selectAll();

    if (filters.tenantId) {
      query = query.where("tenant_id", "=", filters.tenantId);
    }

    if (filters.superadminId) {
      query = query.where("superadmin_id", "=", filters.superadminId);
    }

    if (filters.event) {
      query = query.where("event", "=", filters.event);
    }

    const rows = await query
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0)
      .orderBy("created_at", "desc")
      .execute();

    const countRow = await this.db
      .selectFrom("platform_audit_logs")
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirst();

    const logs = rows.map((r) => {
      let parsedDiff: AuditDiffPayload = {};
      try {
        parsedDiff =
          typeof r.diff === "string"
            ? JSON.parse(r.diff)
            : (r.diff as AuditDiffPayload);
      } catch {
        parsedDiff = {};
      }

      return new (PlatformAuditLog as any)(
        r.id,
        r.superadmin_id,
        r.tenant_id,
        r.event as PlatformAuditEvent,
        r.ip_address,
        r.user_agent,
        parsedDiff,
        new Date(r.created_at),
      );
    });

    return {
      logs,
      total: Number(countRow?.total ?? 0),
    };
  }
}
