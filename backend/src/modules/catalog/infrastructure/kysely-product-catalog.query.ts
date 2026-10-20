import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { IProductCatalogQuery } from "../../pos/application/process-sale.use-case.js";

interface ConversionRecord {
  id: string;
  conversion_rate: string;
}

export class KyselyProductCatalogQuery implements IProductCatalogQuery {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findByIdWithConversions(
    tenantId: string,
    productId: string,
  ): Promise<{
    id: string;
    isService: boolean;
    conversions: Array<{ id: string; conversionRate: number }>;
  } | null> {
    const product = await this.db
      .selectFrom("products")
      .select(["id", "is_service"])
      .where("tenant_id", "=", tenantId)
      .where("id", "=", productId)
      .where("is_active", "=", true)
      .executeTakeFirst();

    if (!product) return null;

    const conversions: ConversionRecord[] = await this.db
      .selectFrom("product_conversions")
      .select(["id", "conversion_rate"])
      .where("tenant_id", "=", tenantId)
      .where("product_id", "=", productId)
      .where("is_active", "=", true)
      .execute();

    return {
      id: product.id,
      isService: product.is_service,
      conversions: conversions.map((c: ConversionRecord) => ({
        id: c.id,
        conversionRate: Number(c.conversion_rate),
      })),
    };
  }

  public async isNegativeStockAllowed(tenantId: string): Promise<boolean> {
    const tenant = await this.db
      .selectFrom("tenants")
      .select("allow_negative_stock")
      .where("id", "=", tenantId)
      .executeTakeFirst();

    return tenant?.allow_negative_stock ?? false;
  }

  public async isSunatModuleActive(tenantId: string): Promise<boolean> {
    const tenant = await this.db
      .selectFrom("tenants")
      .select("module_sunat")
      .where("id", "=", tenantId)
      .executeTakeFirst();

    return tenant?.module_sunat ?? false;
  }
}
