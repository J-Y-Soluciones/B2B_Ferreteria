import { useQuery } from "@tanstack/react-query";
import { catalogRepository } from "../repositories/HttpCatalogRepository";
import type { CatalogProduct } from "../models/catalog.types";

interface UseCatalogQueryOptions {
  searchTerm: string;
  warehouseId: string;
  enabled?: boolean;
}

export function useCatalogQuery({
  searchTerm,
  warehouseId,
  enabled = true,
}: UseCatalogQueryOptions) {
  return useQuery<CatalogProduct[], Error>({
    queryKey: ["catalog", "search", warehouseId, searchTerm.trim()],
    queryFn: async () => {
      return catalogRepository.searchProducts(searchTerm.trim(), warehouseId);
    },
    enabled: Boolean(warehouseId) && enabled,
    staleTime: 1000 * 30, // 30 segundos de frescura
  });
}
