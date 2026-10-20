import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { CreditAccount } from "../domain/credit-account.aggregate.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import {
  ICreditAccountRepository,
  DebtPaymentRecord,
} from "../domain/credit-account.repository.interface.js";

export class KyselyCreditAccountRepository implements ICreditAccountRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async create(account: CreditAccount): Promise<void> {
    const snapshot = account.toSnapshot();
    await this.db
      .insertInto("credit_accounts")
      .values({
        id: snapshot.id,
        tenant_id: snapshot.tenantId,
        customer_id: snapshot.customerId,
        sale_id: snapshot.saleId,
        principal_amount: snapshot.principalAmount.amount.toString(),
        balance: snapshot.balance.amount.toString(),
        status: snapshot.status,
        due_date: snapshot.dueDate,
        created_at: snapshot.createdAt,
      })
      .execute();
  }

  public async update(account: CreditAccount): Promise<void> {
    const snapshot = account.toSnapshot();
    await this.db
      .updateTable("credit_accounts")
      .set({
        balance: snapshot.balance.amount.toString(),
        status: snapshot.status,
      })
      .where("id", "=", snapshot.id)
      .where("tenant_id", "=", snapshot.tenantId)
      .execute();
  }

  public async findPendingByCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<CreditAccount[]> {
    const rows = await this.db
      .selectFrom("credit_accounts")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("customer_id", "=", customerId)
      .where("status", "in", ["PENDING", "PARTIALLY_PAID"])
      .orderBy("created_at", "asc")
      .execute();

    return rows.map((r) =>
      CreditAccount.rehydrate({
        id: r.id,
        tenantId: r.tenant_id,
        customerId: r.customer_id,
        saleId: r.sale_id ?? "",
        principalAmount: Money.from(Number(r.principal_amount)),
        balance: Money.from(Number(r.balance)),
        status: r.status as "PENDING" | "PARTIALLY_PAID" | "PAID",
        dueDate: r.due_date ? new Date(r.due_date) : null,
        createdAt: new Date(r.created_at),
      }),
    );
  }

  public async recordPayment(
    tenantId: string,
    record: DebtPaymentRecord,
  ): Promise<void> {
    await this.db
      .insertInto("debt_payments")
      .values({
        id: record.id,
        tenant_id: tenantId,
        credit_account_id: record.creditAccountId,
        shift_id: record.shiftId,
        amount: record.amount.amount.toString(),
        payment_method: record.paymentMethod,
        reference_code: record.referenceCode ?? null,
      })
      .execute();
  }
}
