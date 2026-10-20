import {
  SearchProductsQuery,
  SearchProductItemDto,
} from "./search-products.dto.js";
import { ICatalogSearchRepository } from "../domain/catalog-search.repository.interface.js";

export class SearchProductsUseCase {
  constructor(private readonly catalogRepo: ICatalogSearchRepository) {}

  public async execute(
    query: SearchProductsQuery,
  ): Promise<SearchProductItemDto[]> {
    const cleanTerm = (query.term ?? "").trim();

    // Solo bloquea si se ingresó exactamente 1 carácter
    if (cleanTerm.length === 1) {
      return [];
    }

    const limit = Math.min(query.limit ?? 50, 50);
    return this.catalogRepo.searchByTerm(
      query.tenantId,
      cleanTerm,
      query.warehouseId,
      limit,
    );
  }
}
