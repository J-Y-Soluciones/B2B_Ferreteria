// src/modules/inventory/repositories/HttpInventoryRepository.ts
import { httpClient } from "@/shared/api/httpClient";
import {
  InventoryMovementMapper,
  type MovementBackendResponseDTO,
} from "../dtos/inventoryMovement.mapper";
import type {
  CreateMovementPayload,
  InventoryMovementResult,
} from "../models/inventoryMovement.types";

export interface Warehouse {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  readonly isDefault: boolean;
  readonly isActive: boolean;
}

export type KardexMovementType =
  | "SALE"
  | "PURCHASE_ENTRY"
  | "PHYSICAL_ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export interface KardexMovement {
  readonly id: string;
  readonly movementType: KardexMovementType;
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
  readonly quantity: number;
  readonly reason: AdjustmentReason;
  readonly notes?: string;
}

export interface WarehouseTransferPayload {
  readonly originWarehouseId: string;
  readonly destinationWarehouseId: string;
  readonly notes?: string;
  readonly items: Array<{
    readonly productId: string;
    readonly quantity: number;
  }>;
}

export interface CreateWarehousePayload {
  readonly name: string;
  readonly address?: string;
}

export interface InventoryRepository {
  createMovement(
    payload: CreateMovementPayload,
  ): Promise<InventoryMovementResult>;
  getWarehouses(): Promise<Warehouse[]>;
  getKardex(
    productId: string,
    warehouseId?: string,
  ): Promise<ProductKardexResponse>;
  recordAdjustment(payload: StockAdjustmentPayload): Promise<void>;
  createTransfer(payload: WarehouseTransferPayload): Promise<void>;
  createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse>;
}

export class HttpInventoryRepository implements InventoryRepository {
  async createMovement(
    payload: CreateMovementPayload,
  ): Promise<InventoryMovementResult> {
    const backendPayload = InventoryMovementMapper.toBackendPayload(payload);
    const idempotencyKey = crypto.randomUUID();

    const response = await httpClient.post<MovementBackendResponseDTO>(
      "/inventory/movements",
      backendPayload,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    return InventoryMovementMapper.toDomain(response.data);
  }

  async getWarehouses(): Promise<Warehouse[]> {
    const response = await httpClient.get<Warehouse[]>("/warehouses");
    return response.data;
  }

  async getKardex(
    productId: string,
    warehouseId?: string,
  ): Promise<ProductKardexResponse> {
    const response = await httpClient.get<ProductKardexResponse>(
      "/inventory/kardex",
      {
        params: {
          productId,
          ...(warehouseId ? { warehouseId } : {}),
        },
      },
    );
    return response.data;
  }

  async recordAdjustment(payload: StockAdjustmentPayload): Promise<void> {
    await httpClient.post("/inventory/adjustments", payload);
  }

  async createTransfer(payload: WarehouseTransferPayload): Promise<void> {
    await httpClient.post("/inventory/transfers", payload);
  }

  async createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
    const response = await httpClient.post<Warehouse>("/warehouses", payload);
    return response.data;
  }
}

export const inventoryRepository = new HttpInventoryRepository();
