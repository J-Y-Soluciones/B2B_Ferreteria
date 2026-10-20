// src/modules/platform/domain/repositories/IPlatformRepository.ts
import type { PlatformMetrics } from "../models/platformMetrics.types";
import type {
  PlatformTenant,
  TenantListFilters,
  TenantListResult,
} from "../models/platformTenant.types";
import type {
  OnboardTenantFormInput,
  UpdateTenantStatusInput,
  UpdateTenantModulesInput,
} from "../schemas/platformTenant.schemas";

export interface IPlatformRepository {
  getMetrics(): Promise<PlatformMetrics>;
  listTenants(filters?: TenantListFilters): Promise<TenantListResult>;
  getTenantById(id: string): Promise<PlatformTenant>;
  onboardTenant(payload: OnboardTenantFormInput): Promise<PlatformTenant>;
  updateTenantStatus(
    id: string,
    payload: UpdateTenantStatusInput,
  ): Promise<PlatformTenant>;
  updateTenantModules(
    id: string,
    payload: UpdateTenantModulesInput,
  ): Promise<PlatformTenant>;
  queryRucSunat(
    ruc: string,
  ): Promise<{ ruc: string; businessName: string; tradeName?: string }>;
  impersonateTenant(
    tenantId: string,
  ): Promise<{ token: string; redirectUrl: string }>;
}
