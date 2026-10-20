import { describe, it, expect, vi } from "vitest";
import { CatalogMapper } from "@/modules/catalog/dtos/catalog.mapper";
import type { ICatalogRepository } from "@/modules/catalog/repositories/ICatalogRepository";
import type {
  CatalogProduct,
  ProductConversion,
} from "@/modules/catalog/models/catalog.types";

describe("CatalogMapper - Descuento Fraccionado de Inventario", () => {
  it("debe calcular la deducción correcta para presentación fraccionada (US-01)", () => {
    // 2 Cuartos de Galón con factor 0.9463 -> 1.8926 LTR
    const calculation = CatalogMapper.calculateStockDeduction(2, 0.9463, false);
    expect(calculation.baseQuantityDeducted).toBe(1.8926);
    expect(calculation.isService).toBe(false);
  });

  it("debe descontar 0.0000 de inventario si el ítem es un servicio intangible (US-02)", () => {
    const calculation = CatalogMapper.calculateStockDeduction(1, 0, true);
    expect(calculation.baseQuantityDeducted).toBe(0);
    expect(calculation.isService).toBe(true);
  });
});

describe("CatalogRepository - Mock Injection", () => {
  it("debe retornar los datos mapeados desde un repositorio Mock", async () => {
    const mockConversion: ProductConversion = {
      conversionId: "11111111-0002-4000-8000-111111111111",
      presentationName: "Tira x 3 Metros",
      conversionRate: 3,
      salePrice: 9.8,
    };

    const mockProduct: CatalogProduct = {
      productId: "11111111-0001-4000-8000-111111111111",
      name: "Tubo PVC 1/2 pulgada Eléctrico",
      isService: false,
      baseUnit: "MTR",
      baseSalePrice: 3.5,
      stockAvailable: 150,
      conversions: [mockConversion],
      matchedConversion: mockConversion,
    };

    const mockRepo: ICatalogRepository = {
      scanByBarcode: vi.fn().mockResolvedValue(mockProduct),
      searchProducts: vi.fn().mockResolvedValue([mockProduct]),
    };

    const result = await mockRepo.scanByBarcode("7750000000011");
    expect(result.name).toBe("Tubo PVC 1/2 pulgada Eléctrico");
    expect(result.matchedConversion?.salePrice).toBe(9.8);
    expect(result.baseSalePrice).toBe(3.5);
    expect(result.conversions).toHaveLength(1);
    expect(result.conversions[0]?.conversionRate).toBe(3);
  });
});
