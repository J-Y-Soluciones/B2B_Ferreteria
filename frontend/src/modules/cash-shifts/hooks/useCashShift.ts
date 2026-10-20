//src/modules/cash-shifts/hooks/useCashShift.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ICashShiftRepository } from "../repositories/ICashShiftRepository";
import { cashShiftRepository } from "../repositories/HttpCashShiftRepository";
import type {
  CashShift,
  CashShiftAudit,
  OpenShiftPayload,
  CloseShiftPayload,
} from "../models/cashShift.types";

export const CASH_SHIFT_QUERY_KEY = ["cash-shifts", "current"] as const;

interface UseCashShiftOptions {
  readonly repository?: ICashShiftRepository;
  readonly onOpenSuccess?: (data: CashShift) => void;
  readonly onCloseSuccess?: (audit?: CashShiftAudit) => void;
  readonly onError?: (error: Error) => void;
}

export function useCurrentShift(customRepo?: ICashShiftRepository) {
  const repo = customRepo ?? cashShiftRepository;
  return useQuery({
    queryKey: CASH_SHIFT_QUERY_KEY,
    queryFn: async () => {
      return await repo.getCurrentShift();
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 15, // 15 segundos
  });
}

export function useCashShift(options: UseCashShiftOptions = {}) {
  const {
    repository = cashShiftRepository,
    onOpenSuccess,
    onCloseSuccess,
    onError,
  } = options;
  const queryClient = useQueryClient();

  const openMutation = useMutation({
    mutationFn: (input: OpenShiftPayload) => repository.openShift(input),
    onSuccess: (data: CashShift) => {
      queryClient.setQueryData(CASH_SHIFT_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: ["cash-shifts"] });
      onOpenSuccess?.(data);
    },
    onError: (err: Error) => onError?.(err),
  });

  const closeMutation = useMutation({
    mutationFn: (payload: CloseShiftPayload) => repository.closeShift(payload),
    onSuccess: (data: CashShift) => {
      queryClient.setQueryData(CASH_SHIFT_QUERY_KEY, null);
      void queryClient.invalidateQueries({ queryKey: ["cash-shifts"] });
      onCloseSuccess?.(data.audit);
    },
    onError: (err: Error) => onError?.(err),
  });

  return {
    openShift: openMutation.mutateAsync,
    isOpening: openMutation.isPending,
    closeShift: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,
  };
}
