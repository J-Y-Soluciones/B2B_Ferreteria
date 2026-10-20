// src/modules/team/hooks/useTenantUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamRepository } from "../repositories/HttpTeamRepository";
import type { ResetPasswordPayload } from "../models/team.types";

export const TENANT_USERS_QUERY_KEY = ["tenant", "users"] as const;

export function useTenantUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: TENANT_USERS_QUERY_KEY,
    queryFn: () => teamRepository.getTenantUsers(),
    staleTime: 1000 * 60 * 2,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      teamRepository.resetUserPassword(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    refetch: usersQuery.refetch,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResetting: resetPasswordMutation.isPending,
  };
}
