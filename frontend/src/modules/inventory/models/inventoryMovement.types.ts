export type InventoryMovementType =
  | "INITIAL_STOCK"
  | "PURCHASE_ENTRY"
  | "POSITIVE_ADJUSTMENT"
  | "NEGATIVE_ADJUSTMENT";

export interface CreateMovementPayload {
  warehouseId: string;
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number;
  reason: string;
}

export interface InventoryMovementResult {
  movementId: string;
  warehouseId: string;
  productId: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}
