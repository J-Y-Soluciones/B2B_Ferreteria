import { ScanProductQuery, ScanProductResult } from "./scan-product.dto.js";
import { ICatalogSearchRepository } from "../domain/catalog-search.repository.interface.js";
import { EntityNotFoundError } from "../../../core/errors/domain.error.js";

export class ScanProductUseCase {
  constructor(private readonly catalogRepo: ICatalogSearchRepository) {}

  public async execute(query: ScanProductQuery): Promise<ScanProductResult> {
    const result = await this.catalogRepo.findByBarcode(
      query.tenantId,
      query.barcode,
      query.warehouseId,
    );

    if (!result) {
      throw new EntityNotFoundError("ProductBarcode", query.barcode);
    }

    return result;
  }
}
