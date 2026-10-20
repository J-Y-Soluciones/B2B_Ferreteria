// src/modules/platform/presentation/schemas/editTenant.schemas.ts
import { z } from "zod";

export const editTenantSchema = z.object({
  businessName: z
    .string()
    .min(3, "La razón social debe tener al menos 3 caracteres"),
  tradeName: z
    .string()
    .min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  profile: z.enum(["HARDWARE_STORE", "LUBRICENTER"]),
  plan: z.object({
    subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]),
    dueDay: z.number().int().min(1).max(31),
    maxCashRegisters: z.number().int().min(1),
    maxUsers: z.number().int().min(1),
    monthlyFee: z.number().min(0),
  }),
  modules: z.object({
    moduleSunat: z.boolean(),
    moduleCredits: z.boolean(),
    moduleMultiwarehouse: z.boolean(),
    allowNegativeStock: z.boolean(),
  }),
});

export type EditTenantFormInput = z.infer<typeof editTenantSchema>;
