import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import type { UpdateProductInput } from "../presentation/create-product.schema.js";
import { EntityNotFoundError } from "../../../core/errors/domain.error.js";

export interface UpdateProductCommand extends UpdateProductInput {
  tenantId: string;
  productId: string;
}

export class UpdateProductUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async execute(command: UpdateProductCommand): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      // 1. Validar existencia
      const existing = await trx
        .selectFrom("products")
        .select(["id", "is_service"])
        .where("id", "=", command.productId)
        .where("tenant_id", "=", command.tenantId)
        .executeTakeFirst();

      if (!existing) {
        throw new EntityNotFoundError("Product", command.productId);
      }

      // 2. Actualizar datos base del producto
      await trx
        .updateTable("products")
        .set({
          name: command.name,
          sku: command.sku ?? null,
          barcode: command.barcode ?? null,
          base_unit: command.baseUnit,
          cost_price:
            command.costPrice !== undefined
              ? command.costPrice.toString()
              : undefined,
          base_sale_price:
            command.baseSalePrice !== undefined
              ? command.baseSalePrice.toString()
              : undefined,
        })
        .where("id", "=", command.productId)
        .where("tenant_id", "=", command.tenantId)
        .execute();

      // 3. Sincronizar min_stock en inventories si fue provisto
      if (!existing.is_service && command.minStock !== undefined) {
        await trx
          .updateTable("inventories")
          .set({
            min_stock: command.minStock.toString(),
            updated_at: new Date(),
          })
          .where("product_id", "=", command.productId)
          .where("tenant_id", "=", command.tenantId)
          .execute();
      }

      // 4. Sincronizar conversiones si fueron provistas
      if (!existing.is_service && command.conversions !== undefined) {
        // Desactivar las conversiones previas y liberar sus barcodes para no colisionar con uq_conversions_tenant_barcode
        await trx
          .updateTable("product_conversions")
          .set({
            is_active: false,
            barcode: null, // 👈 Libera la restricción UNIQUE en las versiones históricas
          })
          .where("product_id", "=", command.productId)
          .where("tenant_id", "=", command.tenantId)
          .execute();

        if (command.conversions.length > 0) {
          const conversionRows = command.conversions.map((conv) => ({
            id: randomUUID(),
            tenant_id: command.tenantId,
            product_id: command.productId,
            presentation_name: conv.presentationName,
            barcode:
              conv.barcode && conv.barcode.trim() !== ""
                ? conv.barcode.trim()
                : null,
            conversion_rate: conv.conversionRate.toString(),
            sale_price: conv.salePrice.toString(),
            is_active: true,
          }));

          await trx
            .insertInto("product_conversions")
            .values(conversionRows)
            .execute();
        }
      }
    });
  }
}
