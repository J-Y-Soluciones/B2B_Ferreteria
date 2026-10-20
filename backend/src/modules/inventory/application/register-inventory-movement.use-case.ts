import { randomUUID } from "node:crypto";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../../shared/application/ports/unit-of-work.port.js";
import { Quantity } from "../../../shared/domain/value-objects/quantity.vo.js";
import {
  EntityNotFoundError,
  DomainValidationError,
  InsufficientStockError,
} from "../../../core/errors/domain.error.js";
import {
  RegisterInventoryMovementCommand,
  InventoryMovementResultDto,
} from "./register-inventory-movement.dto.js";

export interface IInventoryValidationQuery {
  verifyWarehouseBelongsToTenant(
    tenantId: string,
    warehouseId: string,
  ): Promise<boolean>;
  verifyProductBelongsToTenant(
    tenantId: string,
    productId: string,
  ): Promise<{ exists: boolean; isService: boolean } | null>;
  isNegativeStockAllowed(tenantId: string): Promise<boolean>;
}

export class RegisterInventoryMovementUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly validationQuery: IInventoryValidationQuery,
  ) {}

  public async execute(
    command: RegisterInventoryMovementCommand,
  ): Promise<InventoryMovementResultDto> {
    if (command.quantity <= 0) {
      throw new DomainValidationError(
        "La cantidad del movimiento debe ser estrictamente mayor a 0.",
      );
    }

    if (
      command.unitCost !== undefined &&
      command.unitCost !== null &&
      command.unitCost < 0
    ) {
      throw new DomainValidationError(
        "El costo unitario no puede ser negativo.",
      );
    }

    const warehouseValid =
      await this.validationQuery.verifyWarehouseBelongsToTenant(
        command.tenantId,
        command.warehouseId,
      );
    if (!warehouseValid) {
      throw new EntityNotFoundError("Warehouse", command.warehouseId);
    }

    const product = await this.validationQuery.verifyProductBelongsToTenant(
      command.tenantId,
      command.productId,
    );
    if (!product || !product.exists) {
      throw new EntityNotFoundError("Product", command.productId);
    }

    if (product.isService) {
      throw new DomainValidationError(
        "No se pueden registrar movimientos de inventario en servicios intangibles (is_service = true).",
      );
    }

    const movementId = randomUUID();
    const movementQuantity = Quantity.from(command.quantity);
    const createdAt = new Date().toISOString();

    return this.uow.execute(
      command.tenantId,
      async (ctx: UnitOfWorkContext) => {
        let previousStock: number;
        let newStock: number;

        if (command.movementType === "NEGATIVE_ADJUSTMENT") {
          const currentStock = await ctx.inventories.lockStock(
            command.tenantId,
            command.warehouseId,
            command.productId,
          );

          const currentStockVal = currentStock ? currentStock.value : 0;
          const allowNegative =
            await this.validationQuery.isNegativeStockAllowed(command.tenantId);

          if (currentStockVal < movementQuantity.value && !allowNegative) {
            throw new InsufficientStockError(
              command.productId,
              movementQuantity.value,
              currentStockVal,
            );
          }

          await ctx.inventories.deductStock(
            command.tenantId,
            command.warehouseId,
            command.productId,
            movementQuantity,
          );

          previousStock = currentStockVal;
          newStock = currentStockVal - movementQuantity.value;
        } else {
          const stockResult = await ctx.inventories.addStock(
            command.tenantId,
            command.warehouseId,
            command.productId,
            movementQuantity,
          );
          previousStock = stockResult.previousStock;
          newStock = stockResult.newStock;
        }

        if (command.unitCost !== undefined && command.unitCost !== null) {
          await ctx.inventories.updateProductCost(
            command.tenantId,
            command.productId,
            command.unitCost,
          );
        }

        await ctx.inventories.recordMovement(command.tenantId, {
          movementId,
          warehouseId: command.warehouseId,
          productId: command.productId,
          movementType: command.movementType,
          quantity: command.quantity,
          unitCost: command.unitCost ?? null,
          previousStock,
          newStock,
          reason: command.reason.trim(),
          userId: command.userId,
        });

        return {
          movementId,
          warehouseId: command.warehouseId,
          productId: command.productId,
          previousStock,
          newStock,
          createdAt,
        };
      },
    );
  }
}
