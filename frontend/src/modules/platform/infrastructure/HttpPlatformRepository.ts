// src/modules/platform/infrastructure/HttpPlatformRepository.ts
import { httpClient } from "@/shared/api/httpClient";
import type { IPlatformRepository } from "../domain/repositories/IPlatformRepository";
import type { PlatformMetrics } from "../domain/models/platformMetrics.types";
import type {
  PlatformTenant,
  TenantListFilters,
  TenantListResult,
} from "../domain/models/platformTenant.types";
import type {
  OnboardTenantFormInput,
  UpdateTenantStatusInput,
  UpdateTenantModulesInput,
} from "../domain/schemas/platformTenant.schemas";
import { PlatformMetricsMapper } from "./dtos/platformMetrics.dto";
import { PlatformTenantMapper } from "./dtos/platformTenant.dto";

export class HttpPlatformRepository implements IPlatformRepository {
  async getMetrics(): Promise<PlatformMetrics> {
    const response = await httpClient.get("/platform/metrics");
    return PlatformMetricsMapper.toDomain(response.data);
  }

  async listTenants(
    filters: TenantListFilters = {},
  ): Promise<TenantListResult> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.status && filters.status !== "ALL") {
      params.append("status", filters.status);
    }
    if (filters.profile && filters.profile !== "ALL") {
      params.append("profile", filters.profile);
    }
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.offset) params.append("offset", String(filters.offset));

    const response = await httpClient.get(
      `/platform/tenants?${params.toString()}`,
    );
    return PlatformTenantMapper.toListResult(response.data);
  }

  async getTenantById(id: string): Promise<PlatformTenant> {
    const response = await httpClient.get(`/platform/tenants/${id}`);
    return PlatformTenantMapper.toDomain(response.data);
  }

  async onboardTenant(
    payload: OnboardTenantFormInput,
  ): Promise<PlatformTenant> {
    const backendPayload =
      PlatformTenantMapper.toOnboardBackendPayload(payload);
    const response = await httpClient.post("/platform/tenants", backendPayload);
    return PlatformTenantMapper.toDomain(response.data);
  }

  async updateTenantStatus(
    id: string,
    payload: UpdateTenantStatusInput,
  ): Promise<PlatformTenant> {
    const response = await httpClient.patch(
      `/platform/tenants/${id}/status`,
      payload,
    );
    return PlatformTenantMapper.toDomain(response.data);
  }

  async updateTenantModules(
    id: string,
    payload: UpdateTenantModulesInput,
  ): Promise<PlatformTenant> {
    const response = await httpClient.patch(
      `/platform/tenants/${id}/modules`,
      payload,
    );
    return PlatformTenantMapper.toDomain(response.data);
  }

  async queryRucSunat(
    ruc: string,
  ): Promise<{ ruc: string; businessName: string; tradeName?: string }> {
    const response = await httpClient.get(`/platform/ruc-lookup/${ruc}`);
    return response.data;
  }

  async impersonateTenant(
    tenantId: string,
  ): Promise<{ token: string; redirectUrl: string }> {
    const response = await httpClient.post(
      `/platform/tenants/${tenantId}/impersonate`,
    );
    return response.data;
  }
}

export const platformRepository = new HttpPlatformRepository();
