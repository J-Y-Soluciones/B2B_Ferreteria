import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryRepository } from "../repositories/HttpInventoryRepository";
import type {
  CreateMovementPayload,
  InventoryMovementResult,
} from "../models/inventoryMovement.types";

export const INVENTORY_MUTATION_KEY = ["inventory", "movements"] as const;

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovementResult, Error, CreateMovementPayload>({
    mutationKey: INVENTORY_MUTATION_KEY,
    mutationFn: (payload: CreateMovementPayload) =>
      inventoryRepository.createMovement(payload),
    onSuccess: () => {
      // Invalida la caché del catálogo para que el stock se actualice de inmediato en mostrador y tablas
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}
