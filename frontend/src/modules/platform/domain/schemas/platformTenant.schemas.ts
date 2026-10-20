// src/modules/platform/domain/schemas/platformTenant.schemas.ts
import { z } from "zod";

export const onboardTenantSchema = z.object({
  // 1. Datos Fiscales & Identidad
  ruc: z
    .string()
    .length(11, "El RUC debe tener exactamente 11 dígitos")
    .regex(
      /^(10|20|15|17)\d{9}$/,
      "RUC inválido (debe iniciar con 10, 15, 17 o 20)",
    ),
  businessName: z
    .string()
    .min(3, "La razón social debe tener al menos 3 caracteres")
    .max(150),
  tradeName: z
    .string()
    .min(2, "El nombre comercial debe tener al menos 2 caracteres")
    .max(100),
  profile: z.enum(["LUBRICENTER", "HARDWARE_STORE"]),

  // 2. Administrador Inicial (Root del Tenant)
  adminFullName: z
    .string()
    .min(3, "El nombre del administrador es requerido")
    .max(100),
  adminEmail: z
    .string()
    .email("Ingrese un correo electrónico corporativo válido")
    .toLowerCase(),
  temporaryPassword: z
    .string()
    .min(8, "La contraseña temporal debe tener al menos 8 caracteres"),

  // 3. Suscripción Base & Add-ons
  planName: z.enum(["BASIC", "PRO", "ENTERPRISE"]).default("BASIC"),
  gracePeriodDays: z.number().int().min(0).max(60).default(14),
  moduleSunat: z.boolean().default(false),
  moduleCredits: z.boolean().default(true),
  moduleMultiwarehouse: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),
});

export type OnboardTenantFormInput = z.infer<typeof onboardTenantSchema>;
export type OnboardTenantFormRawInput = z.input<typeof onboardTenantSchema>;

export const updateTenantStatusSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]),
  reason: z.string().optional(),
  newExpiresAt: z.string().datetime().optional(),
  newMonthlyFeePen: z.number().positive().optional(),
});

export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;

export const updateTenantModulesSchema = z.object({
  moduleSunat: z.boolean().optional(),
  moduleCredits: z.boolean().optional(),
  moduleMultiwarehouse: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional(),
  maxRegisters: z.number().int().positive().optional(),
  maxUsers: z.number().int().positive().optional(),
});

export type UpdateTenantModulesInput = z.infer<
  typeof updateTenantModulesSchema
>;
