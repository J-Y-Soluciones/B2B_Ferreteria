import type {
  PlatformTenant,
  TenantListResult,
} from "../../domain/models/platformTenant.types";
import type { OnboardTenantFormInput } from "../../domain/schemas/platformTenant.schemas";

export interface PlatformTenantBackendDto {
  id: string;
  ruc: string;
  business_name: string;
  trade_name: string;
  admin_email: string;
  profile: "LUBRICENTER" | "HARDWARE_STORE";
  plan_name: "BASIC" | "PRO" | "ENTERPRISE";
  status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  days_overdue?: number;
  trial_days_remaining?: number;
  expires_at: string;
  monthly_fee_pen: number | string;
  modules: {
    sunat?: boolean;
    credits?: boolean;
    multiwarehouse?: boolean;
    allow_negative_stock?: boolean;
  };
  quotas: {
    current_registers?: number;
    max_registers?: number;
    current_users?: number;
    max_users?: number;
  };
  created_at: string;
}

export class PlatformTenantMapper {
  static toDomain(dto: PlatformTenantBackendDto): PlatformTenant {
    return {
      id: dto.id,
      ruc: dto.ruc,
      businessName: dto.business_name,
      tradeName: dto.trade_name,
      adminEmail: dto.admin_email,
      profile: dto.profile,
      planName: dto.plan_name,
      status: dto.status,
      daysOverdue: dto.days_overdue,
      trialDaysRemaining: dto.trial_days_remaining,
      expiresAt: dto.expires_at,
      monthlyFeePen: Number(dto.monthly_fee_pen ?? 0),
      modules: {
        sunat: Boolean(dto.modules?.sunat),
        credits: Boolean(dto.modules?.credits),
        multiwarehouse: Boolean(dto.modules?.multiwarehouse),
        allowNegativeStock: Boolean(dto.modules?.allow_negative_stock),
      },
      quotas: {
        currentRegisters: dto.quotas?.current_registers ?? 1,
        maxRegisters: dto.quotas?.max_registers ?? 1,
        currentUsers: dto.quotas?.current_users ?? 1,
        maxUsers: dto.quotas?.max_users ?? 2,
      },
      createdAt: dto.created_at,
    };
  }

  static toListResult(response: {
    items: PlatformTenantBackendDto[];
    total: number;
  }): TenantListResult {
    return {
      items: (response.items ?? []).map((item) => this.toDomain(item)),
      total: response.total ?? 0,
    };
  }

  static toOnboardBackendPayload(domain: OnboardTenantFormInput) {
    return {
      ruc: domain.ruc,
      business_name: domain.businessName,
      trade_name: domain.tradeName,
      profile: domain.profile,
      admin_full_name: domain.adminFullName,
      admin_email: domain.adminEmail,
      temporary_password: domain.temporaryPassword,
      plan_name: domain.planName,
      grace_period_days: domain.gracePeriodDays,
      module_sunat: domain.moduleSunat,
      module_credits: domain.moduleCredits,
      module_multiwarehouse: domain.moduleMultiwarehouse,
      allow_negative_stock: domain.allowNegativeStock,
    };
  }
}
