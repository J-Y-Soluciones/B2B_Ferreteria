import { describe, it, expect, beforeEach } from "vitest";
import {
  ProcessSaleUseCase,
  IProductCatalogQuery,
} from "../process-sale.use-case.js";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../../../shared/application/ports/unit-of-work.port.js";
import { Quantity } from "../../../../shared/domain/value-objects/quantity.vo.js";
import { Money } from "../../../../shared/domain/value-objects/money.vo.js";
import { CashShift } from "../../../cash-register/domain/cash-shift.aggregate.js";
import {
  InsufficientStockError,
  CreditLimitExceededError,
} from "../../../../core/errors/domain.error.js";

describe("ProcessSaleUseCase (Checkout Unit of Work)", () => {
  let mockUowContext: Partial<UnitOfWorkContext>;
  let mockUow: IUnitOfWork;
  let mockCatalogQuery: IProductCatalogQuery;
  let useCase: ProcessSaleUseCase;

  const tenantId = "11111111-1111-1111-1111-111111111111";
  const warehouseId = "22222222-2222-2222-2222-222222222222";
  const shiftId = "33333333-3333-3333-3333-333333333333";
  const userId = "44444444-4444-4444-4444-444444444444";
  const customerId = "55555555-5555-5555-5555-555555555555";
  const productId = "66666666-6666-6666-6666-666666666666";

  beforeEach(() => {
    mockUowContext = {
      cashShifts: {
        findById: async () =>
          CashShift.rehydrate({
            id: shiftId,
            tenantId,
            cashRegisterId: "reg-1",
            userId,
            status: "OPEN",
            initialCash: Money.from(100),
            openedAt: new Date(),
            closedAt: null,
            declaredCash: null,
            declaredCards: null,
            declaredYapePlin: null,
            expectedCash: null,
            expectedCards: null,
            expectedYapePlin: null,
            cashDifference: null,
            notes: null,
          }),
        findActiveByRegisterOrUser: async () => null,
        create: async () => {},
        lockShift: async () => null,
        calculateExpectedTotals: async () => ({
          expectedCash: Money.zero(),
          expectedCards: Money.zero(),
          expectedYapePlin: Money.zero(),
        }),
        update: async () => {},
        recordMovement: async () => {},
      },
      inventories: {
        lockStock: async () => Quantity.from(100),
        deductStock: async () => undefined,
        addStock: async () => ({ previousStock: 100, newStock: 100 }),
        recordMovement: async () => undefined,
        updateProductCost: async () => undefined,
      },
      customers: {
        lockCustomerCredit: async () => ({
          id: customerId,
          creditLimit: Money.from(500),
          currentDebt: Money.from(100),
        }),
        increaseDebt: async () => {},
        decreaseDebt: async () => {},
      },
      sales: {
        getNextTicketNumber: async () => 101n,
        save: async () => {},
        findById: async () => null,
      },
      creditAccounts: {
        create: async () => {},
        findPendingByCustomer: async () => [],
        update: async () => {},
        recordPayment: async () => {},
      },
      fiscalOutbox: {
        enqueue: async () => {},
      },
    };

    mockUow = {
      execute: async <T>(
        _tenantId: string,
        op: (ctx: UnitOfWorkContext) => Promise<T>,
      ): Promise<T> => {
        return op(mockUowContext as UnitOfWorkContext);
      },
    };

    mockCatalogQuery = {
      findByIdWithConversions: async () => ({
        id: productId,
        isService: false,
        conversions: [{ id: "conv-1", conversionRate: 0.5 }],
      }),
      isNegativeStockAllowed: async () => false,
      isSunatModuleActive: async () => false,
    };

    useCase = new ProcessSaleUseCase(mockUow, mockCatalogQuery);
  });

  it("debe procesar una venta a crédito válida, guardar la venta e insertar la cuenta de crédito", async () => {
    let creditAccountCreated = false;
    let saleSaved = false;
    let executionOrder: string[] = [];

    mockUowContext.sales!.save = async () => {
      saleSaved = true;
      executionOrder.push("sales.save");
    };

    mockUowContext.creditAccounts!.create = async () => {
      creditAccountCreated = true;
      executionOrder.push("creditAccounts.create");
    };

    const result = await useCase.execute({
      tenantId,
      userId,
      warehouseId,
      shiftId,
      customerId,
      referenceValue: null,
      items: [
        {
          productId,
          conversionId: "conv-1", // 1 unidad x 0.5 = 0.5 base
          quantity: 1,
          unitPrice: 100,
        },
      ],
      payments: [
        {
          paymentMethod: "CREDIT",
          amount: 100,
          referenceCode: null,
        },
      ],
    });

    expect(result.status).toBe("COMPLETED");
    expect(saleSaved).toBe(true);
    expect(creditAccountCreated).toBe(true);
    // Garantiza que la venta se guarde ANTES de crear el registro de crédito (previene FK violation)
    expect(executionOrder).toEqual(["sales.save", "creditAccounts.create"]);
  });

  it("debe registrar la venta y deducir la fracción correcta de stock", async () => {
    let capturedStock: Quantity | null = null;
    mockUowContext.inventories!.deductStock = async (
      _t: string,
      _w: string,
      _p: string,
      delta: Quantity,
    ): Promise<void> => {
      capturedStock = delta;
    };

    const result = await useCase.execute({
      tenantId,
      userId,
      warehouseId,
      shiftId,
      customerId: null,
      referenceValue: "Placa-XYZ",
      items: [
        {
          productId,
          conversionId: "conv-1", // 2 unidades x factor 0.5 = 1.0 base
          quantity: 2,
          unitPrice: 20,
        },
      ],
      payments: [
        {
          paymentMethod: "CASH",
          amount: 40,
          referenceCode: null,
        },
      ],
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.ticketNumber).toBe("101");
    expect(result.total).toBe(40);
    expect(capturedStock).not.toBeNull();
    expect((capturedStock as unknown as Quantity).value).toBe(1.0);
  });

  it("debe rechazar la venta si el stock físico es insuficiente y el tenant prohíbe negativos", async () => {
    mockUowContext.inventories!.lockStock = async () => Quantity.from(0.5);

    await expect(
      useCase.execute({
        tenantId,
        userId,
        warehouseId,
        shiftId,
        customerId: null,
        referenceValue: null,
        items: [
          {
            productId,
            conversionId: "conv-1", // 2 * 0.5 = 1.0 requerido
            quantity: 2,
            unitPrice: 15,
          },
        ],
        payments: [{ paymentMethod: "CASH", amount: 30, referenceCode: null }],
      }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it("debe bloquear la venta a crédito si se sobrepasa la línea autorizada del cliente", async () => {
    await expect(
      useCase.execute({
        tenantId,
        userId,
        warehouseId,
        shiftId,
        customerId,
        referenceValue: null,
        items: [
          {
            productId,
            conversionId: null,
            quantity: 1,
            unitPrice: 450,
          },
        ],
        payments: [
          { paymentMethod: "CREDIT", amount: 450, referenceCode: null },
        ],
      }),
    ).rejects.toThrow(CreditLimitExceededError);
  });
});
