import { ScanProductResult } from "../application/scan-product.dto.js";
import { SearchProductItemDto } from "../application/search-products.dto.js";

export interface ICatalogSearchRepository {
  findByBarcode(
    tenantId: string,
    barcode: string,
    warehouseId?: string,
  ): Promise<ScanProductResult | null>;

  searchByTerm(
    tenantId: string,
    term: string,
    warehouseId?: string,
    limit?: number,
  ): Promise<SearchProductItemDto[]>;
}
