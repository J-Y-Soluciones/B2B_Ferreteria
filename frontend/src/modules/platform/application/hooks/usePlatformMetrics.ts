// src/modules/platform/application/hooks/usePlatformMetrics.ts
import { useQuery } from "@tanstack/react-query";
import { platformRepository } from "../../infrastructure/HttpPlatformRepository";
import type { IPlatformRepository } from "../../domain/repositories/IPlatformRepository";

export const PLATFORM_METRICS_QUERY_KEY = ["platform", "metrics"] as const;

export function usePlatformMetrics(customRepo?: IPlatformRepository) {
  const repo = customRepo ?? platformRepository;

  return useQuery({
    queryKey: PLATFORM_METRICS_QUERY_KEY,
    queryFn: async () => {
      return await repo.getMetrics();
    },
    refetchInterval: 1000 * 30, // Polling suave cada 30s para telemetría
    staleTime: 1000 * 15,
  });
}
