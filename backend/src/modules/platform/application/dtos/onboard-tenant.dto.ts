import { PlanTier } from "../../domain/value-objects/subscription-types.vo.js";
import { TenantProfile } from "../../domain/entities/tenant.entity.js";

export interface OnboardTenantCommand {
  superadminId: string;
  ipAddress: string;
  userAgent: string;
  businessName: string;
  tradeName?: string;
  ruc: string;
  profile: "HARDWARE_STORE" | "LUBRICENTER";
  planName?: string;
  warehouseName?: string;
  warehouseAddress?: string;
  cashRegisterName?: string;
  adminFullName: string;
  adminEmail: string;
  adminPasswordPlain?: string;
  sendInvitationEmail?: boolean;
  moduleSunat?: boolean;
  moduleCredits?: boolean;
  moduleMultiwarehouse?: boolean;
  allowNegativeStock?: boolean;
}

export interface OnboardTenantResult {
  tenantId: string;
  businessName: string;
  ruc: string;
  planName: string;
  subscriptionStatus: string;
  adminUserId: string;
  adminEmail: string;
  temporaryPassword?: string; // 👈 Retorna la clave temporal para el frontend
  defaultWarehouseId: string;
  defaultCashRegisterId: string;
  createdAt: string;
}
