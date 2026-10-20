// src/modules/platform/domain/entities/platform-audit-log.entity.ts
export type PlatformAuditEvent =
  | "TENANT_CREATED"
  | "TENANT_UPDATED"
  | "SUBSCRIPTION_STATUS_CHANGED"
  | "SUBSCRIPTION_PLAN_CHANGED"
  | "MODULES_UPDATED"
  | "USER_PASSWORD_RESET_REQUESTED"
  | "IMPERSONATION_STARTED"
  | "TENANT_IMPERSONATED";

export interface AuditDiffPayload {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

export class PlatformAuditLog {
  private constructor(
    public readonly id: string,
    public readonly superadminId: string,
    public readonly tenantId: string | null,
    public readonly event: PlatformAuditEvent,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly diff: AuditDiffPayload,
    public readonly createdAt: Date,
  ) {}

  public static create(params: {
    id: string;
    superadminId: string;
    tenantId?: string | null;
    event: PlatformAuditEvent;
    ipAddress: string;
    userAgent: string;
    diff: AuditDiffPayload;
  }): PlatformAuditLog {
    return new PlatformAuditLog(
      params.id,
      params.superadminId,
      params.tenantId ?? null,
      params.event,
      params.ipAddress,
      params.userAgent,
      params.diff,
      new Date(),
    );
  }
}
