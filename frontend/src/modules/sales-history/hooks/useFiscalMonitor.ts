import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IFiscalRepository } from "../repositories/IFiscalRepository";
import { fiscalRepository } from "../repositories/HttpFiscalRepository";
import type { FiscalFilterParams } from "../models/fiscal.types";

interface UseFiscalMonitorOptions {
  filters?: FiscalFilterParams;
  repository?: IFiscalRepository;
  pollingIntervalMs?: number;
}

export function useFiscalMonitor({
  filters,
  repository = fiscalRepository,
  pollingIntervalMs = 10000, // Sondeo cada 10s si hay elementos pendientes
}: UseFiscalMonitorOptions = {}) {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ["fiscal", "documents", filters],
    queryFn: () => repository.getFiscalDocuments(filters),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasPending = data?.some(
        (doc) =>
          doc.outboxStatus === "PENDING" || doc.outboxStatus === "PROCESSING",
      );
      return hasPending ? pollingIntervalMs : false;
    },
  });

  const retrySingleMutation = useMutation({
    mutationFn: (documentId: string) =>
      repository.retryFailedDispatch(documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fiscal", "documents"] });
    },
  });

  const retryAllMutation = useMutation({
    mutationFn: () => repository.retryAllFailed(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fiscal", "documents"] });
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    refetch: documentsQuery.refetch,
    retrySingle: retrySingleMutation.mutateAsync,
    isRetryingSingle: retrySingleMutation.isPending,
    retryAll: retryAllMutation.mutateAsync,
    isRetryingAll: retryAllMutation.isPending,
  };
}
