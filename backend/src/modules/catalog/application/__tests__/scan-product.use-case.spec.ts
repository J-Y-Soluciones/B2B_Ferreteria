import { describe, it, expect, beforeEach } from "vitest";
import { ScanProductUseCase } from "../scan-product.use-case.js";
import { ICatalogSearchRepository } from "../../domain/catalog-search.repository.interface.js";
import { EntityNotFoundError } from "../../../../core/errors/domain.error.js";

describe("ScanProductUseCase", () => {
  let mockRepo: ICatalogSearchRepository;
  let useCase: ScanProductUseCase;

  const tenantId = "11111111-1111-1111-1111-111111111111";
  const warehouseId = "22222222-2222-2222-2222-222222222222";

  beforeEach(() => {
    mockRepo = {
      findByBarcode: async (_t, barcode) => {
        if (barcode === "7701234567890") {
          return {
            productId: "prod-01",
            name: "Aceite Shell Helix 20W-50",
            isService: false,
            baseUnit: "LTR",
            matchedConversion: {
              conversionId: "conv-01",
              presentationName: "Cuarto de Galón",
              conversionRate: 0.9463,
              salePrice: 28.0,
            },
            salePrice: 28.0,
            stockAvailable: 55.0,
          };
        }
        return null;
      },
      searchByTerm: async () => [],
    };

    useCase = new ScanProductUseCase(mockRepo);
  });

  it("debe retornar la presentación secundaria asociada al código escaneado con stock disponible", async () => {
    const result = await useCase.execute({
      tenantId,
      barcode: "7701234567890",
      warehouseId,
    });

    expect(result.productId).toBe("prod-01");
    expect(result.matchedConversion).not.toBeNull();
    expect(result.matchedConversion?.presentationName).toBe("Cuarto de Galón");
    expect(result.stockAvailable).toBe(55.0);
  });

  it("debe arrojar EntityNotFoundError si el código no pertenece a ningún ítem del catálogo", async () => {
    await expect(
      useCase.execute({
        tenantId,
        barcode: "0000000000000",
        warehouseId,
      }),
    ).rejects.toThrow(EntityNotFoundError);
  });
});
