// backend/src/modules/customers/infrastructure/kysely-customer.repository.ts
import { randomUUID } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import type { CreateCustomerInput } from "../presentation/customer.schema.js";

export interface CustomerListItem {
  id: string;
  doc_number: string | null;
  name: string;
  phone: string | null;
  credit_limit: number;
  current_debt: number;
  has_overdue_debt: boolean;
}

export class KyselyCustomerRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findAllByTenant(
    tenantId: string,
    search?: string,
  ): Promise<CustomerListItem[]> {
    let query = this.db
      .selectFrom("customers as c")
      .select([
        "c.id",
        "c.doc_number",
        "c.name",
        "c.phone",
        "c.credit_limit",
        "c.current_debt",
        sql<boolean>`EXISTS (
          SELECT 1 FROM credit_accounts ca
          WHERE ca.customer_id = c.id
            AND ca.tenant_id = ${tenantId}
            AND ca.status IN ('PENDING', 'PARTIALLY_PAID')
            AND ca.due_date IS NOT NULL
            AND ca.due_date < CURRENT_DATE
        )`.as("has_overdue_debt"),
      ])
      .where("c.tenant_id", "=", tenantId);

    if (search && search.trim() !== "") {
      const term = search.trim();
      query = query.where((eb) =>
        eb.or([
          sql<boolean>`c.name ILIKE ${"%" + term + "%"}`,
          sql<boolean>`c.doc_number ILIKE ${"%" + term + "%"}`,
        ]),
      );
    }

    const rows = await query.orderBy("c.name", "asc").execute();

    return rows.map((r) => ({
      id: r.id,
      doc_number: r.doc_number,
      name: r.name,
      phone: r.phone,
      credit_limit: Number(r.credit_limit),
      current_debt: Number(r.current_debt),
      has_overdue_debt: Boolean(r.has_overdue_debt),
    }));
  }

  public async findById(
    tenantId: string,
    id: string,
  ): Promise<CustomerListItem | null> {
    const row = await this.db
      .selectFrom("customers as c")
      .select([
        "c.id",
        "c.doc_number",
        "c.name",
        "c.phone",
        "c.credit_limit",
        "c.current_debt",
        sql<boolean>`EXISTS (
          SELECT 1 FROM credit_accounts ca
          WHERE ca.customer_id = c.id
            AND ca.tenant_id = ${tenantId}
            AND ca.status IN ('PENDING', 'PARTIALLY_PAID')
            AND ca.due_date IS NOT NULL
            AND ca.due_date < CURRENT_DATE
        )`.as("has_overdue_debt"),
      ])
      .where("c.tenant_id", "=", tenantId)
      .where("c.id", "=", id)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      doc_number: row.doc_number,
      name: row.name,
      phone: row.phone,
      credit_limit: Number(row.credit_limit),
      current_debt: Number(row.current_debt),
      has_overdue_debt: Boolean(row.has_overdue_debt),
    };
  }

  public async findByDocNumber(tenantId: string, docNumber: string) {
    return await this.db
      .selectFrom("customers")
      .select(["id", "doc_number"])
      .where("tenant_id", "=", tenantId)
      .where("doc_number", "=", docNumber)
      .executeTakeFirst();
  }

  public async createCustomer(tenantId: string, input: CreateCustomerInput) {
    const id = randomUUID();

    await this.db
      .insertInto("customers")
      .values({
        id,
        tenant_id: tenantId,
        name: input.name,
        doc_number: input.doc_number,
        phone: input.phone ?? null,
        credit_limit: input.credit_limit.toString(),
        current_debt: "0.00",
      })
      .execute();

    return {
      id,
      doc_number: input.doc_number,
      name: input.name,
      phone: input.phone ?? null,
      credit_limit: Number(input.credit_limit),
      current_debt: 0.0,
      has_overdue_debt: false,
    };
  }
}
