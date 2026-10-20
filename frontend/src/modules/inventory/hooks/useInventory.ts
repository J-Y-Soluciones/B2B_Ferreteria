// src/modules/inventory/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryRepository,
  type StockAdjustmentPayload,
  type WarehouseTransferPayload,
  type Warehouse,
  type CreateWarehousePayload,
} from "../repositories/HttpInventoryRepository";
import { alertService } from "@/shared/utils/alerts";

export const INVENTORY_KEYS = {
  warehouses: ["inventory", "warehouses"] as const,
  kardex: (productId: string, warehouseId?: string) =>
    ["inventory", "kardex", productId, warehouseId] as const,
};

export function useInventory(
  selectedProductId?: string,
  selectedWarehouseId?: string,
) {
  const queryClient = useQueryClient();

  const warehousesQuery = useQuery<Warehouse[]>({
    queryKey: INVENTORY_KEYS.warehouses,
    queryFn: () => inventoryRepository.getWarehouses(),
    staleTime: 1000 * 60 * 10,
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (payload: CreateWarehousePayload) =>
      inventoryRepository.createWarehouse(payload),
    onSuccess: () => {
      alertService.success(
        "Sede Registrada",
        "El nuevo almacén se creó correctamente.",
      );
      void queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.warehouses,
      });
    },
    onError: (err: Error) => {
      alertService.error("Fallo al crear sede", err.message);
    },
  });

  const kardexQuery = useQuery({
    queryKey: INVENTORY_KEYS.kardex(
      selectedProductId ?? "",
      selectedWarehouseId,
    ),
    queryFn: () =>
      inventoryRepository.getKardex(selectedProductId!, selectedWarehouseId),
    enabled: Boolean(selectedProductId),
  });

  const adjustmentMutation = useMutation({
    mutationFn: (payload: StockAdjustmentPayload) =>
      inventoryRepository.recordAdjustment(payload),
    onSuccess: () => {
      alertService.success(
        "Ajuste Registrado",
        "El stock físico y el Kardex han sido actualizados.",
      );
      void queryClient.invalidateQueries({ queryKey: ["inventory", "kardex"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (err: Error) => {
      alertService.error("Fallo al registrar ajuste", err.message);
    },
  });

  const transferMutation = useMutation({
    mutationFn: (payload: WarehouseTransferPayload) =>
      inventoryRepository.createTransfer(payload),
    onSuccess: () => {
      alertService.success(
        "Traslado Exitoso",
        "La mercadería fue transferida atómicamente entre sedes.",
      );
      void queryClient.invalidateQueries({ queryKey: ["inventory", "kardex"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (err: Error) => {
      alertService.error("Fallo en la transferencia", err.message);
    },
  });

  return {
    warehouses: warehousesQuery.data ?? [],
    isLoadingWarehouses: warehousesQuery.isLoading,
    kardex: kardexQuery.data,
    isLoadingKardex: kardexQuery.isLoading,
    recordAdjustment: adjustmentMutation.mutateAsync,
    isAdjusting: adjustmentMutation.isPending,
    createTransfer: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
    createWarehouse: createWarehouseMutation.mutateAsync,
    isCreatingWarehouse: createWarehouseMutation.isPending,
  };
}
