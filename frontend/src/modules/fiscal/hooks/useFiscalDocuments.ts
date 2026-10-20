// src/modules/fiscal/hooks/useFiscalDocuments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IFiscalRepository } from "../repositories/IFiscalRepository";
import { fiscalRepository } from "../repositories/HttpFiscalRepository";
import type { FiscalFilterParams } from "../models/fiscal.types";

export const FISCAL_DOCUMENTS_QUERY_KEY = ["fiscal", "documents"] as const;

interface UseFiscalDocumentsOptions {
  readonly filters: FiscalFilterParams;
  readonly customRepo?: IFiscalRepository;
}

export function useFiscalDocuments({
  filters,
  customRepo,
}: UseFiscalDocumentsOptions) {
  const repo = customRepo ?? fiscalRepository;
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: [...FISCAL_DOCUMENTS_QUERY_KEY, filters],
    queryFn: () => repo.getDocuments(filters),
    staleTime: 0, // Invalida el caché anterior de inmediato al navegar
    refetchOnMount: "always", // Fuerza un fetch fresco cada vez que entras a la pantalla F7
    refetchInterval: 5000, // Polling cada 5 segundos para reflejar nuevas ventas automáticamente
    refetchOnWindowFocus: true,
  });

  const retryMutation = useMutation<void, Error, string>({
    mutationFn: (documentId: string) => repo.retryDocument(documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: FISCAL_DOCUMENTS_QUERY_KEY,
      });
    },
  });

  return {
    documents: documentsQuery.data?.items ?? [],
    total: documentsQuery.data?.total ?? 0,
    page: documentsQuery.data?.page ?? 1,
    totalPages: documentsQuery.data?.totalPages ?? 1,
    isLoading: documentsQuery.isLoading,
    isRefetching: documentsQuery.isRefetching,
    retryDocument: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
    getFileDownloadUrl: (docId: string, format: "xml" | "pdf") =>
      repo.getFileDownloadUrl(docId, format),
  };
}
