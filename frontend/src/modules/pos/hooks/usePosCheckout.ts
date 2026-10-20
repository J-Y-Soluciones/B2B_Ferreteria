import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IPosRepository } from "../repositories/IPosRepository";
import { posRepository } from "../repositories/HttpPosRepository";
import type {
  CompleteSalePayload,
  SaleConfirmationResult,
} from "../models/pos.types";

interface UsePosCheckoutOptions {
  repository?: IPosRepository;
  onSuccess?: (result: SaleConfirmationResult) => void;
  onError?: (error: Error) => void;
}

export function usePosCheckout(options: UsePosCheckoutOptions = {}) {
  const { repository = posRepository, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CompleteSalePayload) =>
      repository.confirmSale(payload),
    onSuccess: (result) => {
      // Invalida inventarios, ventas y saldos de caja tras la venta atómica
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-shifts"] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess?.(result);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  return {
    confirmSale: mutation.mutateAsync,
    isProcessingSale: mutation.isPending,
  };
}
