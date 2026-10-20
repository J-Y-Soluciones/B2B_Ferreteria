// src/modules/platform/domain/ports/platform-audit.repository.port.ts
import { PlatformAuditLog } from "../entities/platform-audit-log.entity.js";

export interface IPlatformAuditRepository {
  append(log: PlatformAuditLog): Promise<void>;
}
