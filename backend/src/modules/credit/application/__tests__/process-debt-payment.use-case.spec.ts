import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProcessDebtPaymentUseCase } from "../process-debt-payment.use-case.js";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../../../shared/application/ports/unit-of-work.port.js";
import { CreditAccount } from "../../domain/credit-account.aggregate.js";
import { CashShift } from "../../../cash-register/domain/cash-shift.aggregate.js";
import { Money } from "../../../../shared/domain/value-objects/money.vo.js";
import {
  DomainValidationError,
  EntityNotFoundError,
} from "../../../../core/errors/domain.error.js";

describe("ProcessDebtPaymentUseCase (FIFO Amortization UoW-02)", () => {
  let mockUowContext: Partial<UnitOfWorkContext>;
  let mockUow: IUnitOfWork;
  let useCase: ProcessDebtPaymentUseCase;

  const tenantId = "11111111-1111-1111-1111-111111111111";
  const customerId = "55555555-5555-5555-5555-555555555555";
  const shiftId = "33333333-3333-3333-3333-333333333333";

  beforeEach(() => {
    const shift = CashShift.open({
      id: shiftId,
      tenantId,
      cashRegisterId: "reg-01",
      userId: "user-01",
      initialCash: Money.from(100),
      openedAt: new Date(),
    });

    const account1 = CreditAccount.rehydrate({
      id: "acc-01",
      tenantId,
      customerId,
      saleId: "sale-01",
      principalAmount: Money.from(100),
      balance: Money.from(100),
      status: "PENDING",
      dueDate: null,
      createdAt: new Date("2026-10-01"),
    });

    const account2 = CreditAccount.rehydrate({
      id: "acc-02",
      tenantId,
      customerId,
      saleId: "sale-02",
      principalAmount: Money.from(150),
      balance: Money.from(150),
      status: "PENDING",
      dueDate: null,
      createdAt: new Date("2026-10-02"),
    });

    mockUowContext = {
      cashShifts: {
        findById: async () => shift,
        findActiveByRegisterOrUser: async () => null,
        create: async () => {},
        lockShift: async () => shift,
        calculateExpectedTotals: async () => ({
          expectedCash: Money.zero(),
          expectedCards: Money.zero(),
          expectedYapePlin: Money.zero(),
        }),
        update: async () => {},
        recordMovement: vi.fn().mockResolvedValue(undefined),
      },
      customers: {
        lockCustomerCredit: async () => ({
          id: customerId,
          creditLimit: Money.from(500),
          currentDebt: Money.from(250), // Total deuda: 100 + 150 = 250
        }),
        increaseDebt: async () => {},
        decreaseDebt: vi.fn().mockResolvedValue(undefined),
      },
      creditAccounts: {
        create: async () => {},
        findPendingByCustomer: async () => [account1, account2],
        update: async () => {},
        recordPayment: vi.fn().mockResolvedValue(undefined),
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

    useCase = new ProcessDebtPaymentUseCase(mockUow);
  });

  it("debe liquidar cuentas de crédito mediante imputación FIFO estricta y asentar caja", async () => {
    const updatedAccounts: CreditAccount[] = [];
    mockUowContext.creditAccounts!.update = async (account) => {
      updatedAccounts.push(account);
    };

    const result = await useCase.execute({
      tenantId,
      customerId,
      shiftId,
      amount: 150.0, // Abona 150: Cancela acc-01 (100) y reduce acc-02 a 100 (150 - 50)
      paymentMethod: "CASH",
      referenceCode: null,
    });

    expect(result.amortizedAmount).toBe(150.0);
    expect(updatedAccounts).toHaveLength(2);
    expect(updatedAccounts[0].status).toBe("PAID");
    expect(updatedAccounts[0].balance.amount).toBe(0);
    expect(updatedAccounts[1].status).toBe("PARTIALLY_PAID");
    expect(updatedAccounts[1].balance.amount).toBe(100);

    // Verifica que impactó en la caja y en el saldo del cliente
    expect(mockUowContext.customers!.decreaseDebt).toHaveBeenCalled();
    expect(mockUowContext.cashShifts!.recordMovement).toHaveBeenCalled();
  });

  it("debe rechazar la amortización si el monto supera la deuda actual del cliente", async () => {
    await expect(
      useCase.execute({
        tenantId,
        customerId,
        shiftId,
        amount: 300.0, // Deuda es 250
        paymentMethod: "CASH",
        referenceCode: null,
      }),
    ).rejects.toThrow(DomainValidationError);
  });

  it("debe fallar con EntityNotFoundError si el turno de caja no existe", async () => {
    mockUowContext.cashShifts!.findById = async () => null;

    await expect(
      useCase.execute({
        tenantId,
        customerId,
        shiftId: "non-existent-shift",
        amount: 50.0,
        paymentMethod: "CASH",
        referenceCode: null,
      }),
    ).rejects.toThrow(EntityNotFoundError);
  });
});
