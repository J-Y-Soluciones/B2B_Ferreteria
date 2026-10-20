// src/modules/platform/application/hooks/usePlatformTenants.ts
import { useQuery } from "@tanstack/react-query";
import { platformRepository } from "../../infrastructure/HttpPlatformRepository";
import type { IPlatformRepository } from "../../domain/repositories/IPlatformRepository";
import type { TenantListFilters } from "../../domain/models/platformTenant.types";

export const PLATFORM_TENANTS_QUERY_KEY = ["platform", "tenants"] as const;

export function usePlatformTenants(
  filters: TenantListFilters = {},
  customRepo?: IPlatformRepository,
) {
  const repo = customRepo ?? platformRepository;

  return useQuery({
    queryKey: [...PLATFORM_TENANTS_QUERY_KEY, filters],
    queryFn: async () => {
      return await repo.listTenants(filters);
    },
    staleTime: 1000 * 30,
  });
}
