import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { ICatalogSearchRepository } from "../domain/catalog-search.repository.interface.js";
import { ScanProductResult } from "../application/scan-product.dto.js";
import {
  SearchProductItemDto,
  ProductConversionItemDto, // <-- IMPORTACIÓN FALTANTE QUE RESUELVE TS2304
} from "../application/search-products.dto.js";

export class KyselyCatalogSearchRepository implements ICatalogSearchRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private async resolveWarehouseId(
    tenantId: string,
    warehouseId?: string,
  ): Promise<string> {
    if (warehouseId) {
      return warehouseId;
    }

    const defaultWh = await this.db
      .selectFrom("warehouses")
      .select("id")
      .where("tenant_id", "=", tenantId)
      .where("is_default", "=", true)
      .executeTakeFirst();

    if (!defaultWh) {
      throw new Error(
        `No se encontró un almacén por defecto configurado para el tenant ${tenantId}.`,
      );
    }

    return defaultWh.id;
  }

  public async findByBarcode(
    tenantId: string,
    barcode: string,
    warehouseId?: string,
  ): Promise<ScanProductResult | null> {
    const targetWarehouseId = await this.resolveWarehouseId(
      tenantId,
      warehouseId,
    );

    // 1. Verificar si coincide con una presentación secundaria (conversión)
    const convRow = await this.db
      .selectFrom("product_conversions as c")
      .innerJoin("products as p", "p.id", "c.product_id")
      .leftJoin("inventories as i", (join) =>
        join
          .onRef("i.product_id", "=", "p.id")
          .on("i.warehouse_id", "=", targetWarehouseId)
          .on("i.tenant_id", "=", tenantId),
      )
      .select([
        "p.id as product_id",
        "p.name as product_name",
        "p.is_service",
        "p.base_unit",
        "c.id as conversion_id",
        "c.presentation_name",
        "c.conversion_rate",
        "c.sale_price as conversion_price",
        "i.current_stock",
      ])
      .where("c.tenant_id", "=", tenantId)
      .where("c.barcode", "=", barcode)
      .where("c.is_active", "=", true)
      .where("p.is_active", "=", true)
      .executeTakeFirst();

    if (convRow) {
      return {
        productId: convRow.product_id,
        name: convRow.product_name,
        isService: convRow.is_service,
        baseUnit: convRow.base_unit,
        matchedConversion: {
          conversionId: convRow.conversion_id,
          presentationName: convRow.presentation_name,
          conversionRate: Number(convRow.conversion_rate),
          salePrice: Number(convRow.conversion_price),
        },
        salePrice: Number(convRow.conversion_price),
        stockAvailable: convRow.is_service
          ? 0
          : Number(convRow.current_stock ?? "0"),
      };
    }

    // 2. Si no es conversión, verificar si es el código de barra del producto base
    const prodRow = await this.db
      .selectFrom("products as p")
      .leftJoin("inventories as i", (join) =>
        join
          .onRef("i.product_id", "=", "p.id")
          .on("i.warehouse_id", "=", targetWarehouseId)
          .on("i.tenant_id", "=", tenantId),
      )
      .select([
        "p.id as product_id",
        "p.name as product_name",
        "p.is_service",
        "p.base_unit",
        "p.base_sale_price",
        "i.current_stock",
      ])
      .where("p.tenant_id", "=", tenantId)
      .where("p.barcode", "=", barcode)
      .where("p.is_active", "=", true)
      .executeTakeFirst();

    if (prodRow) {
      return {
        productId: prodRow.product_id,
        name: prodRow.product_name,
        isService: prodRow.is_service,
        baseUnit: prodRow.base_unit,
        matchedConversion: null,
        salePrice: Number(prodRow.base_sale_price),
        stockAvailable: prodRow.is_service
          ? 0
          : Number(prodRow.current_stock ?? "0"),
      };
    }

    return null;
  }

  public async searchByTerm(
    tenantId: string,
    term: string,
    warehouseId?: string,
    limit: number = 50,
  ): Promise<SearchProductItemDto[]> {
    const targetWarehouseId = await this.resolveWarehouseId(
      tenantId,
      warehouseId,
    );

    let query = this.db
      .selectFrom("products as p")
      .leftJoin("inventories as i", (join) =>
        join
          .onRef("i.product_id", "=", "p.id")
          .on("i.warehouse_id", "=", targetWarehouseId)
          .on("i.tenant_id", "=", tenantId),
      )
      .select([
        "p.id as product_id",
        "p.name",
        "p.sku",
        "p.barcode",
        "p.base_unit",
        "p.cost_price", // 👈 1. Traer precio costo
        "p.base_sale_price",
        "p.is_service",
        "i.current_stock",
        "i.min_stock", // 👈 2. Traer stock mínimo
        sql<string>`COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'conversionId', pc.id,
                'presentationName', pc.presentation_name,
                'conversionRate', pc.conversion_rate::numeric,
                'salePrice', pc.sale_price::numeric,
                'barcode', pc.barcode
              )
            )
            FROM product_conversions pc
            WHERE pc.product_id = p.id
              AND pc.tenant_id = ${tenantId}
              AND pc.is_active = true
          ),
          '[]'::json
        )`.as("conversions_json"),
      ])
      .where("p.tenant_id", "=", tenantId)
      .where("p.is_active", "=", true);

    if (term.trim() !== "") {
      query = query
        .where((eb) =>
          eb.or([
            sql<boolean>`p.name ILIKE ${"%" + term + "%"}`,
            sql<boolean>`p.barcode ILIKE ${"%" + term + "%"}`,
            sql<boolean>`p.sku ILIKE ${"%" + term + "%"}`,
            sql<boolean>`EXISTS (
              SELECT 1 FROM product_conversions pc_filter 
              WHERE pc_filter.product_id = p.id 
                AND pc_filter.tenant_id = ${tenantId}
                AND pc_filter.is_active = true 
                AND pc_filter.barcode ILIKE ${"%" + term + "%"}
            )`,
          ]),
        )
        .orderBy(sql`similarity(p.name, ${term})`, "desc");
    } else {
      query = query.orderBy("p.name", "asc");
    }

    const rows = await query.limit(limit).execute();

    return rows.map((r) => {
      const parsedConversions: ProductConversionItemDto[] =
        typeof r.conversions_json === "string"
          ? JSON.parse(r.conversions_json)
          : (r.conversions_json as unknown as ProductConversionItemDto[]) || [];

      const currentStock = r.is_service ? 0 : Number(r.current_stock ?? "0");
      const minStock = r.is_service ? 0 : Number(r.min_stock ?? "0");

      return {
        productId: r.product_id,
        name: r.name,
        sku: r.sku ?? null,
        barcode: r.barcode ?? null,
        baseUnit: r.base_unit,
        costPrice: Number(r.cost_price ?? "0"), // 👈 Mapeo de costPrice
        baseSalePrice: Number(r.base_sale_price),
        isService: r.is_service,
        currentStock, // 👈 Mapeo de currentStock
        stockAvailable: currentStock,
        minStock, // 👈 Mapeo de minStock
        conversions: parsedConversions.map((c) => ({
          conversionId: c.conversionId,
          presentationName: c.presentationName,
          conversionRate: Number(c.conversionRate),
          salePrice: Number(c.salePrice),
          barcode: c.barcode ?? null,
        })),
        matchedConversion: null,
      };
    });
  }
}
