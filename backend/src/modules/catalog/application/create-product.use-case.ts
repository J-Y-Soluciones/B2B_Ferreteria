import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import type { CreateProductInput } from "../presentation/create-product.schema.js";

export interface CreateProductCommand extends CreateProductInput {
  tenantId: string;
}

export class CreateProductUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async execute(
    command: CreateProductCommand,
  ): Promise<{ productId: string }> {
    return await this.db.transaction().execute(async (trx) => {
      const productId = randomUUID();

      // 1. Insertar el Producto Base
      await trx
        .insertInto("products")
        .values({
          id: productId,
          tenant_id: command.tenantId,
          name: command.name,
          sku: command.sku ?? null,
          barcode: command.barcode ?? null,
          is_service: command.isService,
          base_unit: command.baseUnit,
          cost_price: command.costPrice.toString(),
          base_sale_price: command.baseSalePrice.toString(),
          is_active: true,
        })
        .execute();

      // 2. Si es Bien Físico, crear el inventario en el almacén por defecto
      if (!command.isService) {
        const defaultWarehouse = await trx
          .selectFrom("warehouses")
          .select("id")
          .where("tenant_id", "=", command.tenantId)
          .where("is_default", "=", true)
          .executeTakeFirst();

        if (defaultWarehouse) {
          await trx
            .insertInto("inventories")
            .values({
              id: randomUUID(),
              tenant_id: command.tenantId,
              warehouse_id: defaultWarehouse.id,
              product_id: productId,
              current_stock: (command.initialStock ?? 0).toString(),
              min_stock: (command.minStock ?? 0).toString(), // <-- Requerido en inventories
              updated_at: new Date(),
            })
            .execute();
        }
      }

      // 3. Registrar conversiones si no es servicio
      if (
        !command.isService &&
        command.conversions &&
        command.conversions.length > 0
      ) {
        const conversionRows = command.conversions.map((conv) => ({
          id: randomUUID(),
          tenant_id: command.tenantId,
          product_id: productId,
          presentation_name: conv.presentationName,
          barcode: conv.barcode ?? null,
          conversion_rate: conv.conversionRate.toString(),
          sale_price: conv.salePrice.toString(),
          is_active: true,
        }));

        await trx
          .insertInto("product_conversions")
          .values(conversionRows)
          .execute();
      }

      return { productId };
    });
  }
}
