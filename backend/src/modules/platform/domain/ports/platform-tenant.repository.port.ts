// src/modules/platform/domain/ports/platform-tenant.repository.port.ts
import { Tenant } from "../entities/tenant.entity.js";
import { SubscriptionState } from "../value-objects/subscription-types.vo.js";

export interface TenantFilters {
  status?: SubscriptionState;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface IPlatformTenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByRuc(ruc: string): Promise<Tenant | null>;
  findAll(
    filters: TenantFilters,
  ): Promise<{ tenants: Tenant[]; total: number }>;
  save(tenant: Tenant): Promise<void>;
  update(tenant: Tenant): Promise<void>;
}
