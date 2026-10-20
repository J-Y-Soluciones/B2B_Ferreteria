import { Kysely, sql, Transaction } from "kysely";
import { DatabaseSchema } from "./database.types.js";
import {
  IUnitOfWork,
  UnitOfWorkContext,
} from "../../application/ports/unit-of-work.port.js";
import { KyselySaleRepository } from "../../../modules/pos/infrastructure/kysely-sale.repository.js";
import { KyselyInventoryRepository } from "../../../modules/inventory/infrastructure/kysely-inventory.repository.js";
import { KyselyCustomerCreditRepository } from "../../../modules/credit/infrastructure/kysely-credit.repository.js";
import { KyselyCreditAccountRepository } from "../../../modules/credit/infrastructure/kysely-credit-account.repository.js";
import { KyselyCashShiftRepository } from "../../../modules/cash-register/infrastructure/kysely-cash-shift.repository.js";
import {
  IFiscalOutboxQueue,
  FiscalOutboxPayload,
} from "../../../modules/fiscal/domain/fiscal-outbox.repository.interface.js";

export class KyselyUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async execute<T>(
    tenantId: string,
    operation: (ctx: UnitOfWorkContext) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      // Aplicación obligatoria de aislamiento multi-tenant por conexión
      await sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`.execute(
        trx,
      );

      const ctx: UnitOfWorkContext = {
        sales: new KyselySaleRepository(trx),
        inventories: new KyselyInventoryRepository(trx),
        customers: new KyselyCustomerCreditRepository(trx),
        creditAccounts: new KyselyCreditAccountRepository(trx),
        cashShifts: new KyselyCashShiftRepository(trx),
        fiscalOutbox: new TransactionFiscalOutboxQueue(trx),
      };

      return operation(ctx);
    });
  }
}

class TransactionFiscalOutboxQueue implements IFiscalOutboxQueue {
  constructor(private readonly trx: Transaction<DatabaseSchema>) {}

  public async enqueue(
    tenantId: string,
    payload: FiscalOutboxPayload,
  ): Promise<void> {
    await this.trx
      .insertInto("fiscal_outbox")
      .values({
        tenant_id: tenantId,
        sale_id: payload.saleId,
        payload: JSON.stringify(payload),
        status: "PENDING",
      })
      .execute();
  }
}
