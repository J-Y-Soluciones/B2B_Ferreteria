import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";

export interface GetCurrentCashShiftCommand {
  tenantId: string;
  userId: string;
}

export interface CurrentCashShiftDto {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  userId: string;
  status: "OPEN" | "CLOSED";
  initialCash: number;
  openedAt: string;
}

export class GetCurrentCashShiftUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async execute(
    command: GetCurrentCashShiftCommand,
  ): Promise<CurrentCashShiftDto | null> {
    const shift = await this.db
      .selectFrom("cash_shifts")
      .select([
        "id",
        "tenant_id",
        "cash_register_id",
        "user_id",
        "status",
        "initial_cash",
        "opened_at",
      ])
      .where("tenant_id", "=", command.tenantId)
      .where("user_id", "=", command.userId)
      .where("status", "=", "OPEN")
      .orderBy("opened_at", "desc")
      .executeTakeFirst();

    if (!shift) {
      return null;
    }

    return {
      id: shift.id,
      tenantId: shift.tenant_id,
      cashRegisterId: shift.cash_register_id,
      userId: shift.user_id,
      status: shift.status,
      initialCash: Number(shift.initial_cash),
      openedAt: shift.opened_at.toISOString(),
    };
  }
}
