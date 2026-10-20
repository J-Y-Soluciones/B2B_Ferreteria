import type { CatalogProduct } from "../models/catalog.types";

export interface ICatalogRepository {
  scanByBarcode(barcode: string, warehouseId?: string): Promise<CatalogProduct>;
  searchProducts(
    query: string,
    warehouseId?: string,
  ): Promise<CatalogProduct[]>;
}
