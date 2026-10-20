import { InventoryMovementType } from "../domain/inventory.repository.interface.js";

export interface RegisterInventoryMovementCommand {
  tenantId: string;
  userId: string;
  warehouseId: string;
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number | null;
  reason: string;
}

export interface InventoryMovementResultDto {
  movementId: string;
  warehouseId: string;
  productId: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}
