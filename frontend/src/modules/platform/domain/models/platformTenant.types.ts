export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
export type TenantBusinessProfile = "LUBRICENTER" | "HARDWARE_STORE";
export type SubscriptionPlan = "BASIC" | "PRO" | "ENTERPRISE";

export interface TenantModules {
  readonly sunat: boolean;
  readonly credits: boolean;
  readonly multiwarehouse: boolean;
  readonly allowNegativeStock: boolean;
}

export interface TenantQuotas {
  readonly currentRegisters: number;
  readonly maxRegisters: number;
  readonly currentUsers: number;
  readonly maxUsers: number;
}

export interface PlatformTenant {
  readonly id: string;
  readonly ruc: string;
  readonly businessName: string; // Razón Social
  readonly tradeName: string; // Nombre Comercial
  readonly adminEmail: string;
  readonly profile: TenantBusinessProfile;
  readonly planName: SubscriptionPlan;
  readonly status: SubscriptionStatus;
  readonly daysOverdue?: number;
  readonly trialDaysRemaining?: number;
  readonly expiresAt: string; // ISO-8601
  readonly monthlyFeePen: number;
  readonly modules: TenantModules;
  readonly quotas: TenantQuotas;
  readonly createdAt: string;
}

export interface TenantListFilters {
  readonly search?: string;
  readonly status?: SubscriptionStatus | "ALL";
  readonly profile?: TenantBusinessProfile | "ALL";
  readonly module?: "sunat" | "credits" | "multiwarehouse";
  readonly limit?: number;
  readonly offset?: number;
}

export interface TenantListResult {
  readonly items: PlatformTenant[];
  readonly total: number;
}
