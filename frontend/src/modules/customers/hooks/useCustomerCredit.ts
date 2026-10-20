import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customerRepository } from "../repositories/HttpCustomerRepository";
import type { CustomerDebtPaymentInput } from "../models/customer.types";

interface UseCustomerCreditOptions {
  readonly customerId?: string;
  readonly onSuccessPayment?: () => void;
}

export function useCustomerCredit(options: UseCustomerCreditOptions = {}) {
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: (input: CustomerDebtPaymentInput) =>
      customerRepository.recordDebtPayment(input),
    onSuccess: async () => {
      // 1. Invalida todas las consultas de clientes (lista, búsqueda, KPIs y detalle)
      await queryClient.invalidateQueries({ queryKey: ["customers"] });

      // 2. Invalida los movimientos de caja para que el arqueo de turno refleje el abono
      await queryClient.invalidateQueries({ queryKey: ["cash-shifts"] });

      options.onSuccessPayment?.();
    },
  });

  return {
    recordPayment: paymentMutation.mutateAsync,
    isSubmittingPayment: paymentMutation.isPending,
    paymentError: paymentMutation.error,
  };
}
