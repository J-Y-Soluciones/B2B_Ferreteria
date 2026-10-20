import { describe, it, expect, beforeEach } from "vitest";
import { CloseCashShiftUseCase } from "../close-cash-shift.use-case.js";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../../../shared/application/ports/unit-of-work.port.js";
import { CashShift } from "../../domain/cash-shift.aggregate.js";
import { Money } from "../../../../shared/domain/value-objects/money.vo.js";
import {
  ShiftClosedError,
  EntityNotFoundError,
} from "../../../../core/errors/domain.error.js";

describe("CloseCashShiftUseCase (Blind Arqueo Unit of Work)", () => {
  let mockUowContext: Partial<UnitOfWorkContext>;
  let mockUow: IUnitOfWork;
  let useCase: CloseCashShiftUseCase;

  const tenantId = "11111111-1111-1111-1111-111111111111";
  const shiftId = "33333333-3333-3333-3333-333333333333";
  const userId = "44444444-4444-4444-4444-444444444444";

  beforeEach(() => {
    const shift = CashShift.open({
      id: shiftId,
      tenantId,
      cashRegisterId: "reg-01",
      userId,
      initialCash: Money.from(100.0),
      openedAt: new Date(),
    });

    mockUowContext = {
      cashShifts: {
        findById: async () => shift,
        findActiveByRegisterOrUser: async () => null,
        create: async () => {},
        lockShift: async () => shift,
        calculateExpectedTotals: async () => ({
          expectedCash: Money.from(450.0),
          expectedCards: Money.from(200.0),
          expectedYapePlin: Money.from(150.0),
        }),
        update: async () => {},
        recordMovement: async () => {},
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

    useCase = new CloseCashShiftUseCase(mockUow);
  });

  it("debe cerrar la caja a ciegas y calcular la diferencia exacta de efectivo", async () => {
    const result = await useCase.execute({
      tenantId,
      shiftId,
      userId,
      declaredCash: 545.0, // Faltante de 5.00 soles (declarado 545 vs esperado 550)
      declaredCards: 200.0,
      declaredYapePlin: 150.0,
      notes: "Arqueo regular de fin de turno",
    });

    expect(result.status).toBe("CLOSED");
    expect(result.audit.expectedCash).toBe(550.0);
    expect(result.audit.declaredCash).toBe(545.0);
    expect(result.audit.cashDifference).toBe(-5.0);
    expect(result.audit.expectedCards).toBe(200.0);
    expect(result.audit.expectedYapePlin).toBe(150.0);
  });

  it("debe arrojar EntityNotFoundError si el turno no existe para el tenant", async () => {
    mockUowContext.cashShifts!.lockShift = async () => null;

    await expect(
      useCase.execute({
        tenantId,
        shiftId: "non-existent",
        userId,
        declaredCash: 100,
        declaredCards: 0,
        declaredYapePlin: 0,
        notes: null,
      }),
    ).rejects.toThrow(EntityNotFoundError);
  });

  it("debe arrojar ShiftClosedError si el turno ya fue cerrado previamente", async () => {
    const closedShift = CashShift.rehydrate({
      id: shiftId,
      tenantId,
      cashRegisterId: "reg-01",
      userId,
      status: "CLOSED",
      initialCash: Money.from(100),
      openedAt: new Date(),
      closedAt: new Date(),
      declaredCash: Money.from(100),
      declaredCards: Money.zero(),
      declaredYapePlin: Money.zero(),
      expectedCash: Money.from(100),
      expectedCards: Money.zero(),
      expectedYapePlin: Money.zero(),
      cashDifference: 0,
      notes: null,
    });

    mockUowContext.cashShifts!.lockShift = async () => closedShift;

    await expect(
      useCase.execute({
        tenantId,
        shiftId,
        userId,
        declaredCash: 100,
        declaredCards: 0,
        declaredYapePlin: 0,
        notes: null,
      }),
    ).rejects.toThrow(ShiftClosedError);
  });
});
