import { randomUUID } from "node:crypto";
import {
  OpenCashShiftCommand,
  OpenCashShiftResult,
} from "./open-cash-shift.dto.js";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../../shared/application/ports/unit-of-work.port.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { CashShift } from "../domain/cash-shift.aggregate.js";
import { DomainValidationError } from "../../../core/errors/domain.error.js";

export class OpenCashShiftUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  public async execute(
    command: OpenCashShiftCommand,
  ): Promise<OpenCashShiftResult> {
    return this.uow.execute(
      command.tenantId,
      async (ctx: UnitOfWorkContext): Promise<OpenCashShiftResult> => {
        // 1. Resolver cashRegisterId si no fue enviado
        let targetRegisterId = command.cashRegisterId;

        if (!targetRegisterId) {
          // Consultar caja por defecto o primera activa usando el repositorio o query
          const defaultRegister = await (
            ctx.cashShifts as any
          ).findDefaultRegister?.(command.tenantId);

          if (defaultRegister) {
            targetRegisterId = defaultRegister.id;
          } else {
            // Si la implementación de Kysely no tiene findDefaultRegister aún,
            // usar fallback de búsqueda directa o lanzar validación
            targetRegisterId = await (
              ctx.cashShifts as any
            ).getOrCreateDefaultRegister?.(command.tenantId);
          }
        }

        if (!targetRegisterId) {
          throw new DomainValidationError(
            "No se encontró una caja registradora activa para la sucursal. Especifique cash_register_id.",
          );
        }

        // 2. Validar que no exista ya un turno abierto para este cajero o para este terminal
        const activeShift = await ctx.cashShifts.findActiveByRegisterOrUser(
          command.tenantId,
          targetRegisterId,
          command.userId,
        );

        if (activeShift) {
          throw new DomainValidationError(
            `Existe un turno abierto activo en la caja o para el usuario indicado (Turno ID: ${activeShift.id}).`,
          );
        }

        const shiftId = randomUUID();
        const initialCashVo = Money.from(command.initialCash);

        const shift = CashShift.open({
          id: shiftId,
          tenantId: command.tenantId,
          cashRegisterId: targetRegisterId,
          userId: command.userId,
          initialCash: initialCashVo,
          openedAt: new Date(),
        });

        await ctx.cashShifts.create(shift);

        const snap = shift.toSnapshot();
        return {
          shiftId: snap.id,
          cashRegisterId: snap.cashRegisterId,
          userId: snap.userId,
          status: "OPEN",
          initialCash: snap.initialCash.amount,
          openedAt: snap.openedAt.toISOString(),
        };
      },
    );
  }
}
