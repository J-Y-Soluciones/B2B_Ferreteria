// src/modules/inventory/models/inventory.types.ts

export interface Warehouse {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  readonly isDefault: boolean;
  readonly isActive: boolean;
}

export type InventoryMovementType =
  | "SALE"
  | "PURCHASE_ENTRY"
  | "PHYSICAL_ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export interface KardexMovement {
  readonly id: string;
  readonly movementType: InventoryMovementType;
  readonly quantity: number;
  readonly balanceAfter: number;
  readonly referenceDocument?: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly performedBy?: string;
}

export interface ProductKardexResponse {
  readonly productId: string;
  readonly warehouseId: string;
  readonly currentStock: number;
  readonly movements: KardexMovement[];
  readonly total: number;
}

export type AdjustmentReason =
  | "DAMAGE"
  | "EXPIRATION"
  | "COUNT_DISCREPANCY"
  | "PURCHASE_RECEIPT";

export interface StockAdjustmentPayload {
  readonly warehouseId: string;
  readonly productId: string;
  readonly type: "PHYSICAL_ADJUSTMENT" | "PURCHASE_ENTRY";
  readonly quantity: number; // Positivo (ingreso) o negativo (merma)
  readonly reason: AdjustmentReason;
  readonly notes?: string;
}

export interface WarehouseTransferItem {
  readonly productId: string;
  readonly quantity: number;
}

export interface WarehouseTransferPayload {
  readonly originWarehouseId: string;
  readonly destinationWarehouseId: string;
  readonly notes?: string;
  readonly items: WarehouseTransferItem[];
}
