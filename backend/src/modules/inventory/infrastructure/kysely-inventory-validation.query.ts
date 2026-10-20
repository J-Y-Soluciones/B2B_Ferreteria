import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { IInventoryValidationQuery } from "../application/register-inventory-movement.use-case.js";

export class KyselyInventoryValidationQuery implements IInventoryValidationQuery {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async verifyWarehouseBelongsToTenant(
    tenantId: string,
    warehouseId: string,
  ): Promise<boolean> {
    const row = await this.db
      .selectFrom("warehouses")
      .select("id")
      .where("tenant_id", "=", tenantId)
      .where("id", "=", warehouseId)
      .executeTakeFirst();

    return Boolean(row);
  }

  public async verifyProductBelongsToTenant(
    tenantId: string,
    productId: string,
  ): Promise<{ exists: boolean; isService: boolean } | null> {
    const row = await this.db
      .selectFrom("products")
      .select(["id", "is_service"])
      .where("tenant_id", "=", tenantId)
      .where("id", "=", productId)
      .where("is_active", "=", true)
      .executeTakeFirst();

    if (!row) return null;
    return { exists: true, isService: row.is_service };
  }

  public async isNegativeStockAllowed(tenantId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("tenants")
      .select("allow_negative_stock")
      .where("id", "=", tenantId)
      .executeTakeFirst();

    return row?.allow_negative_stock ?? false;
  }
}
