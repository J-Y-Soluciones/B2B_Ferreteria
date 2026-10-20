import {
  CloseCashShiftCommand,
  CloseCashShiftResult,
} from "./close-cash-shift.dto.js";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../../shared/application/ports/unit-of-work.port.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { EntityNotFoundError } from "../../../core/errors/domain.error.js";

export class CloseCashShiftUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  public async execute(
    command: CloseCashShiftCommand,
  ): Promise<CloseCashShiftResult> {
    return this.uow.execute(
      command.tenantId,
      async (ctx: UnitOfWorkContext): Promise<CloseCashShiftResult> => {
        // 1. Bloqueo pesimista del turno para evitar transacciones concurrentes durante el arqueo
        const shift = await ctx.cashShifts.lockShift(
          command.tenantId,
          command.shiftId,
        );
        if (!shift) {
          throw new EntityNotFoundError("CashShift", command.shiftId);
        }

        // 2. Verificar que el turno siga en estado 'OPEN'
        shift.ensureIsOpen();

        // 3. Cómputo teórico exacto desde el ledger transaccional
        const theoretical = await ctx.cashShifts.calculateExpectedTotals(
          command.tenantId,
          command.shiftId,
        );

        // El efectivo esperado incluye el fondo inicial de apertura
        const shiftSnapshot = shift.toSnapshot();
        const totalExpectedCash = shiftSnapshot.initialCash.add(
          theoretical.expectedCash,
        );

        const declared = {
          cash: Money.from(command.declaredCash),
          cards: Money.from(command.declaredCards),
          yapePlin: Money.from(command.declaredYapePlin),
        };

        const expected = {
          cash: totalExpectedCash,
          cards: theoretical.expectedCards,
          yapePlin: theoretical.expectedYapePlin,
        };

        // 4. Ejecutar el arqueo ciego dentro del agregado
        shift.closeBlind(declared, expected, command.notes);

        // 5. Persistir el resultado
        await ctx.cashShifts.update(shift);

        const closedSnap = shift.toSnapshot();

        return {
          id: closedSnap.id,
          status: "CLOSED",
          closedAt: (closedSnap.closedAt as Date).toISOString(),
          audit: {
            expectedCash: closedSnap.expectedCash!.amount,
            declaredCash: closedSnap.declaredCash!.amount,
            cashDifference: closedSnap.cashDifference!,
            expectedCards: closedSnap.expectedCards!.amount,
            declaredCards: closedSnap.declaredCards!.amount,
            expectedYapePlin: closedSnap.expectedYapePlin!.amount,
            declaredYapePlin: closedSnap.declaredYapePlin!.amount,
          },
        };
      },
    );
  }
}
