import { Transaction, Selectable } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import {
  ICashShiftRepository,
  ShiftTheoreticalBalance,
  CashMovementRecord,
} from "../domain/cash-shift.repository.interface.js";
import { CashShift } from "../domain/cash-shift.aggregate.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";

export class KyselyCashShiftRepository implements ICashShiftRepository {
  constructor(private readonly trx: Transaction<DatabaseSchema>) {}

  private mapRowToEntity(
    row: Selectable<DatabaseSchema["cash_shifts"]>,
  ): CashShift {
    return CashShift.rehydrate({
      id: row.id,
      tenantId: row.tenant_id,
      cashRegisterId: row.cash_register_id,
      userId: row.user_id,
      status: row.status,
      initialCash: Money.from(Number(row.initial_cash)),
      openedAt: new Date(row.opened_at),
      closedAt: row.closed_at ? new Date(row.closed_at) : null,
      declaredCash: row.declared_cash
        ? Money.from(Number(row.declared_cash))
        : null,
      declaredCards: row.declared_cards
        ? Money.from(Number(row.declared_cards))
        : null,
      declaredYapePlin: row.declared_yape_plin
        ? Money.from(Number(row.declared_yape_plin))
        : null,
      expectedCash: row.expected_cash
        ? Money.from(Number(row.expected_cash))
        : null,
      expectedCards: row.expected_cards
        ? Money.from(Number(row.expected_cards))
        : null,
      expectedYapePlin: row.expected_yape_plin
        ? Money.from(Number(row.expected_yape_plin))
        : null,
      cashDifference: row.cash_difference ? Number(row.cash_difference) : null,
      notes: row.notes,
    });
  }

  public async findById(
    tenantId: string,
    id: string,
  ): Promise<CashShift | null> {
    const row = await this.trx
      .selectFrom("cash_shifts")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? this.mapRowToEntity(row) : null;
  }

  public async findActiveByRegisterOrUser(
    tenantId: string,
    cashRegisterId: string,
    userId: string,
  ): Promise<CashShift | null> {
    const row = await this.trx
      .selectFrom("cash_shifts")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("status", "=", "OPEN")
      .where((eb) =>
        eb.or([
          eb("cash_register_id", "=", cashRegisterId),
          eb("user_id", "=", userId),
        ]),
      )
      .executeTakeFirst();

    return row ? this.mapRowToEntity(row) : null;
  }

  public async create(shift: CashShift): Promise<void> {
    const snap = shift.toSnapshot();
    await this.trx
      .insertInto("cash_shifts")
      .values({
        id: snap.id,
        tenant_id: snap.tenantId,
        cash_register_id: snap.cashRegisterId,
        user_id: snap.userId,
        status: snap.status,
        initial_cash: snap.initialCash.amount.toFixed(2),
        opened_at: snap.openedAt,
      })
      .execute();
  }

  public async lockShift(
    tenantId: string,
    id: string,
  ): Promise<CashShift | null> {
    const row = await this.trx
      .selectFrom("cash_shifts")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .forUpdate()
      .executeTakeFirst();

    return row ? this.mapRowToEntity(row) : null;
  }

  public async calculateExpectedTotals(
    tenantId: string,
    shiftId: string,
  ): Promise<ShiftTheoreticalBalance> {
    const payments = await this.trx
      .selectFrom("sale_payments")
      .innerJoin("sales", "sales.id", "sale_payments.sale_id")
      .select(["sale_payments.payment_method", "sale_payments.amount"])
      .where("sales.tenant_id", "=", tenantId)
      .where("sales.shift_id", "=", shiftId)
      .where("sales.status", "=", "COMPLETED")
      .execute();

    let expectedCash = Money.zero();
    let expectedCards = Money.zero();
    let expectedYapePlin = Money.zero();

    for (const p of payments) {
      const amount = Money.from(Number(p.amount));
      if (p.payment_method === "CASH") expectedCash = expectedCash.add(amount);
      if (p.payment_method === "CARD")
        expectedCards = expectedCards.add(amount);
      if (p.payment_method === "YAPE_PLIN")
        expectedYapePlin = expectedYapePlin.add(amount);
    }

    const debtPayments = await this.trx
      .selectFrom("debt_payments")
      .select(["payment_method", "amount"])
      .where("tenant_id", "=", tenantId)
      .where("shift_id", "=", shiftId)
      .execute();

    for (const dp of debtPayments) {
      const amount = Money.from(Number(dp.amount));
      if (dp.payment_method === "CASH") expectedCash = expectedCash.add(amount);
      if (dp.payment_method === "CARD")
        expectedCards = expectedCards.add(amount);
      if (dp.payment_method === "YAPE_PLIN")
        expectedYapePlin = expectedYapePlin.add(amount);
    }

    const movements = await this.trx
      .selectFrom("cash_movements")
      .select(["movement_type", "amount"])
      .where("tenant_id", "=", tenantId)
      .where("shift_id", "=", shiftId)
      .execute();

    for (const m of movements) {
      const amount = Money.from(Number(m.amount));
      if (m.movement_type === "INFLOW") {
        expectedCash = expectedCash.add(amount);
      } else if (m.movement_type === "OUTFLOW") {
        expectedCash = expectedCash.subtract(amount);
      }
    }

    return { expectedCash, expectedCards, expectedYapePlin };
  }

  public async update(shift: CashShift): Promise<void> {
    const snap = shift.toSnapshot();
    await this.trx
      .updateTable("cash_shifts")
      .set({
        status: snap.status,
        closed_at: snap.closedAt,
        declared_cash: snap.declaredCash?.amount.toFixed(2),
        declared_cards: snap.declaredCards?.amount.toFixed(2),
        declared_yape_plin: snap.declaredYapePlin?.amount.toFixed(2),
        expected_cash: snap.expectedCash?.amount.toFixed(2),
        expected_cards: snap.expectedCards?.amount.toFixed(2),
        expected_yape_plin: snap.expectedYapePlin?.amount.toFixed(2),
        cash_difference:
          snap.cashDifference !== null ? snap.cashDifference.toFixed(2) : null,
        notes: snap.notes,
      })
      .where("tenant_id", "=", snap.tenantId)
      .where("id", "=", snap.id)
      .execute();
  }

  public async recordMovement(
    tenantId: string,
    movement: CashMovementRecord,
  ): Promise<void> {
    await this.trx
      .insertInto("cash_movements")
      .values({
        id: movement.id,
        tenant_id: tenantId,
        shift_id: movement.shiftId,
        movement_type: movement.movementType,
        amount: movement.amount.amount.toFixed(2),
        reason: movement.reason,
      })
      .execute();
  }
}
