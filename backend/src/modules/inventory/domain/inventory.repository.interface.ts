import { Quantity } from "../../../shared/domain/value-objects/quantity.vo.js";

export type InventoryMovementType =
  | "INITIAL_STOCK"
  | "PURCHASE_ENTRY"
  | "POSITIVE_ADJUSTMENT"
  | "NEGATIVE_ADJUSTMENT";

export interface RecordMovementParams {
  movementId: string;
  warehouseId: string;
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number | null;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
}

export interface IInventoryRepository {
  lockStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
  ): Promise<Quantity | null>;

  deductStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
    delta: Quantity,
  ): Promise<void>;

  addStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
    delta: Quantity,
  ): Promise<{ previousStock: number; newStock: number }>;

  recordMovement(
    tenantId: string,
    movement: RecordMovementParams,
  ): Promise<void>;

  updateProductCost(
    tenantId: string,
    productId: string,
    unitCost: number,
  ): Promise<void>;
}
