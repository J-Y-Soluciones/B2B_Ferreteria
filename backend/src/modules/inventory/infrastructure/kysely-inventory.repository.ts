import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import {
  IInventoryRepository,
  RecordMovementParams,
} from "../domain/inventory.repository.interface.js";
import { Quantity } from "../../../shared/domain/value-objects/quantity.vo.js";

export class KyselyInventoryRepository implements IInventoryRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async lockStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
  ): Promise<Quantity | null> {
    const row = await this.db
      .selectFrom("inventories")
      .select("current_stock")
      .where("tenant_id", "=", tenantId)
      .where("warehouse_id", "=", warehouseId)
      .where("product_id", "=", productId)
      .forUpdate()
      .executeTakeFirst();

    if (!row) return null;
    return Quantity.from(Number(row.current_stock));
  }

  public async deductStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
    delta: Quantity,
  ): Promise<void> {
    await this.db
      .updateTable("inventories")
      .set({
        current_stock: sql`current_stock - ${delta.value}`,
        updated_at: new Date(),
      })
      .where("tenant_id", "=", tenantId)
      .where("warehouse_id", "=", warehouseId)
      .where("product_id", "=", productId)
      .execute();
  }

  public async addStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
    delta: Quantity,
  ): Promise<{ previousStock: number; newStock: number }> {
    // 1. Bloquear y consultar stock actual si existe
    const existing = await this.db
      .selectFrom("inventories")
      .select("current_stock")
      .where("tenant_id", "=", tenantId)
      .where("warehouse_id", "=", warehouseId)
      .where("product_id", "=", productId)
      .forUpdate()
      .executeTakeFirst();

    const previousStock = existing ? Number(existing.current_stock) : 0;
    const newStock = previousStock + delta.value;

    // 2. Upsert atómico en inventories
    await this.db
      .insertInto("inventories")
      .values({
        tenant_id: tenantId,
        warehouse_id: warehouseId,
        product_id: productId,
        current_stock: newStock.toString(),
        min_stock: "0.0000",
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(["tenant_id", "warehouse_id", "product_id"]).doUpdateSet({
          current_stock: newStock.toString(),
          updated_at: new Date(),
        }),
      )
      .execute();

    return { previousStock, newStock };
  }

  public async recordMovement(
    tenantId: string,
    movement: RecordMovementParams,
  ): Promise<void> {
    await this.db
      .insertInto("inventory_movements")
      .values({
        id: movement.movementId,
        tenant_id: tenantId,
        warehouse_id: movement.warehouseId,
        product_id: movement.productId,
        movement_type: movement.movementType,
        quantity: movement.quantity.toString(),
        unit_cost:
          movement.unitCost != null ? movement.unitCost.toString() : null,
        previous_stock: movement.previousStock.toString(),
        new_stock: movement.newStock.toString(),
        reason: movement.reason,
        user_id: movement.userId,
        created_at: new Date(),
      })
      .execute();
  }

  public async updateProductCost(
    tenantId: string,
    productId: string,
    unitCost: number,
  ): Promise<void> {
    await this.db
      .updateTable("products")
      .set({
        cost_price: unitCost.toString(),
      })
      .where("tenant_id", "=", tenantId)
      .where("id", "=", productId)
      .execute();
  }
}
