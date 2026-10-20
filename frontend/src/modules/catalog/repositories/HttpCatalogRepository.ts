import { httpClient } from "@/shared/api/httpClient";
import {
  productScanResponseSchema,
  type ProductScanResponseDTO,
} from "@/shared/api/domainTypes";
import type { ICatalogRepository } from "./ICatalogRepository";
import type { CatalogProduct } from "../models/catalog.types";
import { ApiProductOutput, CatalogMapper } from "../dtos/catalog.mapper";

export class HttpCatalogRepository implements ICatalogRepository {
  async scanByBarcode(
    barcode: string,
    warehouseId?: string,
  ): Promise<CatalogProduct> {
    const response = await httpClient.get<ProductScanResponseDTO>(
      "/catalog/products/scan",
      {
        params: {
          barcode,
          ...(warehouseId ? { warehouse_id: warehouseId } : {}),
        },
      },
    );

    const validatedDTO = productScanResponseSchema.parse(response.data);
    return CatalogMapper.toDomain(validatedDTO);
  }

  async createProduct(payload: unknown): Promise<void> {
    await httpClient.post("/catalog/products", payload);
  }

  async updateProduct(productId: string, payload: unknown): Promise<void> {
    await httpClient.patch(`/catalog/products/${productId}`, payload);
  }

  async searchProducts(
    searchTerm: string,
    warehouseId: string,
  ): Promise<CatalogProduct[]> {
    const response = await httpClient.get<unknown>("/catalog/products/search", {
      params: {
        term: searchTerm,
        warehouse_id: warehouseId,
      },
    });

    const rawList = Array.isArray(response.data)
      ? response.data
      : ((response.data as { value?: unknown[] })?.value ?? []);

    return (rawList as ApiProductOutput[]).map((item) =>
      CatalogMapper.toDomain(item),
    );
  }
}

export const catalogRepository = new HttpCatalogRepository();
