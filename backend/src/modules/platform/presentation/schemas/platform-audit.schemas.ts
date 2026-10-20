import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  tenant_id: z.string().uuid().optional(),
  superadmin_id: z.string().uuid().optional(),
  event: z
    .enum([
      "TENANT_CREATED",
      "SUBSCRIPTION_STATUS_CHANGED",
      "SUBSCRIPTION_PLAN_CHANGED",
      "MODULES_UPDATED",
      "USER_PASSWORD_RESET_REQUESTED",
      "IMPERSONATION_STARTED",
    ])
    .optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});
