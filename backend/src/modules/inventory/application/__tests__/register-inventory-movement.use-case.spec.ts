import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterInventoryMovementUseCase } from "../register-inventory-movement.use-case.js";
import { Quantity } from "../../../../shared/domain/value-objects/quantity.vo.js";
import {
  EntityNotFoundError,
  DomainValidationError,
  InsufficientStockError,
} from "../../../../core/errors/domain.error.js";

describe("RegisterInventoryMovementUseCase", () => {
  const mockInventoriesRepo = {
    lockStock: vi.fn(),
    deductStock: vi.fn(),
    addStock: vi.fn(),
    recordMovement: vi.fn(),
    updateProductCost: vi.fn(),
  };

  const mockUow = {
    execute: vi.fn((_tenantId, callback) =>
      callback({ inventories: mockInventoriesRepo }),
    ),
  };

  const mockValidationQuery = {
    verifyWarehouseBelongsToTenant: vi.fn(),
    verifyProductBelongsToTenant: vi.fn(),
    isNegativeStockAllowed: vi.fn(),
  };

  let useCase: RegisterInventoryMovementUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RegisterInventoryMovementUseCase(
      mockUow as any,
      mockValidationQuery as any,
    );
  });

  it("debe registrar una entrada positiva de stock y actualizar Kardex", async () => {
    mockValidationQuery.verifyWarehouseBelongsToTenant.mockResolvedValue(true);
    mockValidationQuery.verifyProductBelongsToTenant.mockResolvedValue({
      exists: true,
      isService: false,
    });
    mockInventoriesRepo.addStock.mockResolvedValue({
      previousStock: 10,
      newStock: 25,
    });

    const result = await useCase.execute({
      tenantId: "11111111-1111-1111-1111-111111111111",
      userId: "user-123",
      warehouseId: "4b9f1d2e-0000-0000-0000-000000000001",
      productId: "prod-cable-1",
      movementType: "PURCHASE_ENTRY",
      quantity: 15,
      unitCost: 20.5,
      reason: "Factura Proveedor F001-123",
    });

    expect(result.previousStock).toBe(10);
    expect(result.newStock).toBe(25);
    expect(mockInventoriesRepo.updateProductCost).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "prod-cable-1",
      20.5,
    );
    expect(mockInventoriesRepo.recordMovement).toHaveBeenCalledTimes(1);
  });

  it("debe rechazar un ajuste si la cantidad es menor o igual a cero", async () => {
    await expect(
      useCase.execute({
        tenantId: "11111111-1111-1111-1111-111111111111",
        userId: "user-123",
        warehouseId: "4b9f1d2e-0000-0000-0000-000000000001",
        productId: "prod-cable-1",
        movementType: "POSITIVE_ADJUSTMENT",
        quantity: 0,
        reason: "Ajuste nulo",
      }),
    ).rejects.toBeInstanceOf(DomainValidationError);
  });

  it("debe rechazar ajuste en un producto con is_service = true", async () => {
    mockValidationQuery.verifyWarehouseBelongsToTenant.mockResolvedValue(true);
    mockValidationQuery.verifyProductBelongsToTenant.mockResolvedValue({
      exists: true,
      isService: true,
    });

    await expect(
      useCase.execute({
        tenantId: "11111111-1111-1111-1111-111111111111",
        userId: "user-123",
        warehouseId: "4b9f1d2e-0000-0000-0000-000000000001",
        productId: "service-corte-1",
        movementType: "INITIAL_STOCK",
        quantity: 10,
        reason: "Stock inicial servicio no permitido",
      }),
    ).rejects.toBeInstanceOf(DomainValidationError);
  });

  it("debe lanzar InsufficientStockError en NEGATIVE_ADJUSTMENT si stock no alcanza y tenant no permite negativos", async () => {
    mockValidationQuery.verifyWarehouseBelongsToTenant.mockResolvedValue(true);
    mockValidationQuery.verifyProductBelongsToTenant.mockResolvedValue({
      exists: true,
      isService: false,
    });
    mockValidationQuery.isNegativeStockAllowed.mockResolvedValue(false);
    mockInventoriesRepo.lockStock.mockResolvedValue(Quantity.from(5));

    await expect(
      useCase.execute({
        tenantId: "11111111-1111-1111-1111-111111111111",
        userId: "user-123",
        warehouseId: "4b9f1d2e-0000-0000-0000-000000000001",
        productId: "prod-cable-1",
        movementType: "NEGATIVE_ADJUSTMENT",
        quantity: 10,
        reason: "Merma por daño",
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("debe lanzar EntityNotFoundError si el almacén no pertenece al tenant", async () => {
    mockValidationQuery.verifyWarehouseBelongsToTenant.mockResolvedValue(false);

    await expect(
      useCase.execute({
        tenantId: "11111111-1111-1111-1111-111111111111",
        userId: "user-123",
        warehouseId: "wh-inexistente",
        productId: "prod-cable-1",
        movementType: "INITIAL_STOCK",
        quantity: 10,
        reason: "Prueba almacén ajeno",
      }),
    ).rejects.toBeInstanceOf(EntityNotFoundError);
  });
});
