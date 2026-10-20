import { z } from "zod";

export const onboardTenantSchema = z
  .object({
    business_name: z.string().min(3).max(255).optional(),
    businessName: z.string().min(3).max(255).optional(),
    trade_name: z.string().max(255).optional(),
    tradeName: z.string().max(255).optional(),
    ruc: z.string().regex(/^\d{11}$/, "El RUC debe tener 11 dígitos numéricos"),
    profile: z.enum(["HARDWARE_STORE", "LUBRICENTER"]),
    plan_name: z.enum(["BASIC", "PRO", "ENTERPRISE"]).optional().default("PRO"),
    planName: z.enum(["BASIC", "PRO", "ENTERPRISE"]).optional(),
    warehouse_name: z.string().max(100).optional(),
    warehouseName: z.string().max(100).optional(),
    warehouse_address: z.string().max(255).optional(),
    warehouseAddress: z.string().max(255).optional(),
    cash_register_name: z.string().max(100).optional(),
    cashRegisterName: z.string().max(100).optional(),
    admin_full_name: z.string().min(3).max(150).optional(),
    adminFullName: z.string().min(3).max(150).optional(),
    admin_email: z.string().email().optional(),
    adminEmail: z.string().email().optional(),

    // Contraseña: tolera todas las nomenclaturas
    admin_password_plain: z.string().min(8).optional(),
    adminPasswordPlain: z.string().min(8).optional(),
    temporaryPassword: z.string().min(8).optional(),
    temporary_password: z.string().min(8).optional(),
    adminPassword: z.string().min(8).optional(),
    initialPassword: z.string().min(8).optional(),

    send_invitation_email: z.boolean().optional().default(false),
    sendInvitationEmail: z.boolean().optional(),

    // Módulos
    module_sunat: z.boolean().optional(),
    moduleSunat: z.boolean().optional(),
    module_credits: z.boolean().optional(),
    moduleCredits: z.boolean().optional(),
    module_multiwarehouse: z.boolean().optional(),
    moduleMultiwarehouse: z.boolean().optional(),
    allow_negative_stock: z.boolean().optional(),
    allowNegativeStock: z.boolean().optional(),
  })
  .passthrough()
  .transform((data) => ({
    business_name: data.business_name ?? data.businessName ?? "",
    trade_name: data.trade_name ?? data.tradeName,
    ruc: data.ruc,
    profile: data.profile,
    plan_name: data.planName ?? data.plan_name ?? "PRO",
    warehouse_name: data.warehouse_name ?? data.warehouseName,
    warehouse_address: data.warehouse_address ?? data.warehouseAddress,
    cash_register_name: data.cash_register_name ?? data.cashRegisterName,
    admin_full_name: data.admin_full_name ?? data.adminFullName ?? "",
    admin_email: data.admin_email ?? data.adminEmail ?? "",
    admin_password_plain:
      data.admin_password_plain ??
      data.adminPasswordPlain ??
      data.temporaryPassword ??
      data.temporary_password ??
      data.adminPassword ??
      data.initialPassword,
    send_invitation_email:
      data.send_invitation_email ?? data.sendInvitationEmail ?? false,
    module_sunat: data.module_sunat ?? data.moduleSunat ?? true,
    module_credits: data.module_credits ?? data.moduleCredits ?? true,
    module_multiwarehouse:
      data.module_multiwarehouse ?? data.moduleMultiwarehouse ?? false,
    allow_negative_stock:
      data.allow_negative_stock ?? data.allowNegativeStock ?? false,
  }));

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]),
  reason: z.string().max(500).optional(),
  new_expires_at: z.string().datetime().optional(),
  new_monthly_fee: z.number().nonnegative().optional(),
});

export const updateTenantModulesSchema = z.object({
  module_sunat: z.boolean().optional(),
  module_credits: z.boolean().optional(),
  module_multiwarehouse: z.boolean().optional(),
  max_cash_registers: z.number().int().positive().optional(),
  max_users: z.number().int().positive().optional(),
  allow_negative_stock: z.boolean().optional(),
});

export const listTenantsQuerySchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const updateTenantFullSchema = z
  .object({
    businessName: z.string().min(3).optional(),
    tradeName: z.string().min(2).optional(),
    profile: z.enum(["HARDWARE_STORE", "LUBRICENTER"]).optional(),
    plan: z
      .object({
        subscriptionStatus: z
          .enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"])
          .optional(),
        dueDay: z.number().int().optional(), // 👈 Acepta el dueDay enviado por el frontend
        maxCashRegisters: z.number().int().min(1).optional(),
        maxUsers: z.number().int().min(1).optional(),
        monthlyFee: z.number().nonnegative().optional(),
      })
      .passthrough() // 👈 Tolera propiedades extra sin fallar
      .optional(),
    modules: z
      .object({
        moduleSunat: z.boolean().optional(),
        moduleCredits: z.boolean().optional(),
        moduleMultiwarehouse: z.boolean().optional(),
        allowNegativeStock: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type UpdateTenantFullInput = z.infer<typeof updateTenantFullSchema>;
