// src/modules/platform/application/hooks/useOnboardTenant.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { platformRepository } from "../../infrastructure/HttpPlatformRepository";
import type { IPlatformRepository } from "../../domain/repositories/IPlatformRepository";
import type { OnboardTenantFormInput } from "../../domain/schemas/platformTenant.schemas";
import { PLATFORM_TENANTS_QUERY_KEY } from "./usePlatformTenants";
import { PLATFORM_METRICS_QUERY_KEY } from "./usePlatformMetrics";

interface UseOnboardTenantOptions {
  readonly customRepo?: IPlatformRepository;
  readonly onSuccess?: () => void;
  readonly onError?: (error: Error) => void;
}

export function useOnboardTenant(options: UseOnboardTenantOptions = {}) {
  const { customRepo, onSuccess, onError } = options;
  const repo = customRepo ?? platformRepository;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: OnboardTenantFormInput) =>
      repo.onboardTenant(payload),
    onSuccess: async () => {
      // Invalida la lista de tenants y los KPIs para refrescar contadores en vivo
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_TENANTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PLATFORM_METRICS_QUERY_KEY }),
      ]);
      onSuccess?.();
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  return {
    onboardTenant: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
