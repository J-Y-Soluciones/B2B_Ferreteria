import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";

export interface CashRegisterDto {
  id: string;
  name: string;
  is_active: boolean;
}

export class ListCashRegistersUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async execute(tenantId: string): Promise<CashRegisterDto[]> {
    const registers = await this.db
      .selectFrom("cash_registers")
      .select(["id", "name", "is_active"])
      .where("tenant_id", "=", tenantId)
      .where("is_active", "=", true)
      .orderBy("name", "asc")
      .execute();

    return registers.map((r) => ({
      id: r.id,
      name: r.name,
      is_active: r.is_active,
    }));
  }
}
