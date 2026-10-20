import type {
  CreateMovementPayload,
  InventoryMovementResult,
} from "../models/inventoryMovement.types";

export interface CreateMovementBackendDTO {
  warehouse_id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  reason: string;
}

export interface MovementBackendResponseDTO {
  movement_id: string;
  warehouse_id: string;
  product_id: string;
  previous_stock: number | string;
  new_stock: number | string;
  created_at: string;
}

export class InventoryMovementMapper {
  static toBackendPayload(
    domain: CreateMovementPayload,
  ): CreateMovementBackendDTO {
    return {
      warehouse_id: domain.warehouseId,
      product_id: domain.productId,
      movement_type: domain.movementType,
      quantity: domain.quantity,
      ...(domain.unitCost !== undefined &&
      Number.isFinite(domain.unitCost) &&
      domain.unitCost >= 0
        ? { unit_cost: domain.unitCost }
        : {}),
      reason: domain.reason.trim(),
    };
  }

  static toDomain(dto: MovementBackendResponseDTO): InventoryMovementResult {
    return {
      movementId: dto.movement_id,
      warehouseId: dto.warehouse_id,
      productId: dto.product_id,
      previousStock: Number(dto.previous_stock),
      newStock: Number(dto.new_stock),
      createdAt: dto.created_at,
    };
  }
}
