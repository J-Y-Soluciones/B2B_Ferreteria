import { Transaction, sql } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { ISaleRepository } from "../domain/sale.repository.interface.js";
import { Sale } from "../domain/sale.aggregate.js";

export class KyselySaleRepository implements ISaleRepository {
  constructor(private readonly trx: Transaction<DatabaseSchema>) {}

  public async getNextTicketNumber(tenantId: string): Promise<bigint> {
    const row = await this.trx
      .selectFrom("sales")
      .select(
        sql<string>`COALESCE(MAX(ticket_number), 0) + 1`.as("next_ticket"),
      )
      .where("tenant_id", "=", tenantId)
      .executeTakeFirstOrThrow();

    return BigInt(row.next_ticket);
  }

  public async save(sale: Sale): Promise<void> {
    const snap = sale.toSnapshot();

    await this.trx
      .insertInto("sales")
      .values({
        id: snap.id,
        tenant_id: snap.tenantId,
        warehouse_id: snap.warehouseId,
        shift_id: snap.shiftId,
        customer_id: snap.customerId,
        user_id: snap.userId,
        ticket_number: snap.ticketNumber.toString(),
        subtotal: snap.subtotal.amount.toFixed(2),
        discount: snap.discount.amount.toFixed(2),
        total: snap.total.amount.toFixed(2),
        status: snap.status,
        reference_value: snap.referenceValue,
      })
      .execute();

    for (const item of snap.items) {
      await this.trx
        .insertInto("sale_items")
        .values({
          id: item.id,
          sale_id: snap.id,
          product_id: item.productId,
          conversion_id: item.conversionId,
          quantity_sold: item.quantitySold.value.toFixed(4),
          conversion_rate: item.conversionRate.toFixed(4),
          base_quantity_deducted: item.baseQuantityDeducted.value.toFixed(4),
          unit_price: item.unitPrice.amount.toFixed(2),
          subtotal: item.subtotal.amount.toFixed(2),
        })
        .execute();
    }

    for (const payment of snap.payments) {
      await this.trx
        .insertInto("sale_payments")
        .values({
          id: payment.id,
          sale_id: snap.id,
          payment_method: payment.paymentMethod,
          amount: payment.amount.amount.toFixed(2),
          reference_code: payment.referenceCode,
        })
        .execute();
    }
  }

  public async findById(): Promise<Sale | null> {
    return null;
  }
}
