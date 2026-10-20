// backend/src/modules/credit/infrastructure/kysely-customer-credit.repository.ts
import { Transaction, sql } from "kysely";
import type { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import type {
  ICustomerRepository,
  CustomerCreditState,
} from "../domain/customer.repository.interface.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";

export class KyselyCustomerCreditRepository implements ICustomerRepository {
  constructor(private readonly trx: Transaction<DatabaseSchema>) {}

  public async lockCustomerCredit(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerCreditState | null> {
    const row = await this.trx
      .selectFrom("customers")
      .select(["id", "credit_limit", "current_debt"])
      .where("tenant_id", "=", tenantId)
      .where("id", "=", customerId)
      .forUpdate()
      .executeTakeFirst();

    if (!row) return null;
    return {
      id: row.id,
      creditLimit: Money.from(Number(row.credit_limit)),
      currentDebt: Money.from(Number(row.current_debt)),
    };
  }

  public async increaseDebt(
    tenantId: string,
    customerId: string,
    amount: Money,
  ): Promise<void> {
    await this.trx
      .updateTable("customers")
      .set({
        current_debt: sql`current_debt + ${amount.amount}`,
      })
      .where("tenant_id", "=", tenantId)
      .where("id", "=", customerId)
      .execute();
  }

  public async decreaseDebt(
    tenantId: string,
    customerId: string,
    amount: Money,
  ): Promise<void> {
    await this.trx
      .updateTable("customers")
      .set({
        current_debt: sql`current_debt - ${amount.amount}`,
      })
      .where("tenant_id", "=", tenantId)
      .where("id", "=", customerId)
      .execute();
  }
}
