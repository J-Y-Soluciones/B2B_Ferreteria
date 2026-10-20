import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ICatalogRepository } from "../repositories/ICatalogRepository";
import { catalogRepository } from "../repositories/HttpCatalogRepository";
import type { CatalogProduct } from "../models/catalog.types";

interface UseProductScanOptions {
  warehouseId?: string;
  repository?: ICatalogRepository;
  onSuccess?: (product: CatalogProduct) => void;
  onError?: (error: Error) => void;
}

export function useProductScan(options: UseProductScanOptions = {}) {
  const {
    warehouseId,
    repository = catalogRepository,
    onSuccess,
    onError,
  } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barcode: string) => {
      return repository.scanByBarcode(barcode, warehouseId);
    },
    onSuccess: (product) => {
      queryClient.setQueryData(
        ["catalog", "products", product.productId],
        product,
      );
      onSuccess?.(product);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
