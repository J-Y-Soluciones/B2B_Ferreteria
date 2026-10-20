import { randomUUID } from "node:crypto";
import type { IUnitOfWork } from "../../../shared/application/ports/unit-of-work.port.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { CreditAccount } from "../domain/credit-account.aggregate.js";
import {
  EntityNotFoundError,
  DomainValidationError,
} from "../../../core/errors/domain.error.js";
import type {
  ProcessDebtPaymentCommand,
  ProcessDebtPaymentResult,
} from "./process-debt-payment.dto.js";

export class ProcessDebtPaymentUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  public async execute(
    command: ProcessDebtPaymentCommand,
  ): Promise<ProcessDebtPaymentResult> {
    const paymentAmountVo = Money.from(command.amount);

    if (paymentAmountVo.amount <= 0) {
      throw new DomainValidationError("El monto del abono debe ser mayor a 0.");
    }

    return this.uow.execute(command.tenantId, async (ctx) => {
      // 1. Validar que la caja esté abierta y pertenezca al tenant[cite: 8]
      const shift = await ctx.cashShifts.findById(
        command.tenantId,
        command.shiftId,
      );
      if (!shift) {
        throw new EntityNotFoundError("CashShift", command.shiftId);
      }
      shift.ensureIsOpen();

      // 2. Bloquear cliente para control de concurrencia y validar deuda[cite: 8]
      const customer = await ctx.customers.lockCustomerCredit(
        command.tenantId,
        command.customerId,
      );
      if (!customer) {
        throw new EntityNotFoundError("Customer", command.customerId);
      }

      if (customer.currentDebt.amount <= 0) {
        throw new DomainValidationError(
          "El cliente no registra saldo deudor pendiente.",
        );
      }

      if (paymentAmountVo.isGreaterThan(customer.currentDebt)) {
        throw new DomainValidationError(
          `El monto a pagar (S/ ${paymentAmountVo.amount.toFixed(2)}) supera la deuda actual (S/ ${customer.currentDebt.amount.toFixed(2)}).`,
        );
      }

      // 3. Obtener cuentas de crédito pendientes (FIFO)[cite: 8]
      let pendingAccounts: CreditAccount[] =
        await ctx.creditAccounts.findPendingByCustomer(
          command.tenantId,
          command.customerId,
        );

      // Fallback de integridad si el cliente registra deuda pero no tenía fila en credit_accounts
      if (pendingAccounts.length === 0 && customer.currentDebt.amount > 0) {
        const fallbackAccount = CreditAccount.rehydrate({
          id: randomUUID(),
          tenantId: command.tenantId,
          customerId: command.customerId,
          saleId: randomUUID(),
          principalAmount: customer.currentDebt,
          balance: customer.currentDebt,
          status: "PENDING",
          dueDate: null,
          createdAt: new Date(),
        });

        await ctx.creditAccounts.create(fallbackAccount);
        pendingAccounts = [fallbackAccount];
      }

      // 4. Imputación secuencial del abono entre las cuentas (FIFO)[cite: 8]
      let remainingPayment = paymentAmountVo;
      let lastPaymentId = randomUUID();

      for (const account of pendingAccounts) {
        if (remainingPayment.amount <= 0) break;

        const snap = account.toSnapshot(); // <-- Snapshot que contiene todas las propiedades de dominio
        const currentBalance = snap.balance;
        const deduction = remainingPayment.isGreaterThan(currentBalance)
          ? currentBalance
          : remainingPayment;

        const newBalance = currentBalance.subtract(deduction);
        const newStatus = newBalance.amount === 0 ? "PAID" : "PARTIALLY_PAID";

        // Rehidratar agregando el nuevo balance y estado
        const updatedAccount = CreditAccount.rehydrate({
          id: snap.id,
          tenantId: snap.tenantId,
          customerId: snap.customerId,
          saleId: snap.saleId,
          principalAmount: snap.principalAmount, // <-- Corregido usando snap.principalAmount
          balance: newBalance,
          status: newStatus,
          dueDate: snap.dueDate,
          createdAt: snap.createdAt, // <-- Corregido usando snap.createdAt
        });

        // Actualizar balance y estado de la cuenta
        await ctx.creditAccounts.update(updatedAccount);

        // Registrar el pago vinculado al credit_account_id existente[cite: 8]
        lastPaymentId = randomUUID();
        await ctx.creditAccounts.recordPayment(command.tenantId, {
          id: lastPaymentId,
          creditAccountId: snap.id,
          shiftId: command.shiftId,
          amount: deduction,
          paymentMethod: command.paymentMethod,
          referenceCode: command.referenceCode ?? null,
        });

        remainingPayment = remainingPayment.subtract(deduction);
      }

      // 5. Descontar la deuda global acumulada del cliente
      const newCustomerDebt = customer.currentDebt.subtract(paymentAmountVo);
      await ctx.customers.decreaseDebt(
        command.tenantId,
        command.customerId,
        paymentAmountVo,
      );

      // 6. Asentar movimiento en la caja del turno si el abono fue en efectivo[cite: 8]
      if (command.paymentMethod === "CASH") {
        await ctx.cashShifts.recordMovement(command.tenantId, {
          id: randomUUID(),
          shiftId: command.shiftId,
          movementType: "DEBT_COLLECTION",
          amount: paymentAmountVo,
          reason: `Cobranza de fiado - Cliente: ${command.customerId}`,
        });
      }

      return {
        paymentId: lastPaymentId,
        customerId: command.customerId,
        amortizedAmount: paymentAmountVo.amount,
        remainingDebt: newCustomerDebt.amount,
        registeredInShift: command.shiftId,
        createdAt: new Date().toISOString(),
      };
    });
  }
}
