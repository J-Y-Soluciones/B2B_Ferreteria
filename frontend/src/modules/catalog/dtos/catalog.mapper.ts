import type {
  CatalogProduct,
  ProductConversion,
  StockDeductionCalculation,
} from "../models/catalog.types";
import type { ProductConfigSavePayload } from "../schemas/product.schema";

export interface ApiProductOutput {
  id?: string;
  productId?: string;
  name: string;
  isService?: boolean;
  is_service?: boolean;
  baseUnit?: string;
  base_unit?: string;
  baseSalePrice?: number | string;
  base_sale_price?: number | string;
  stockAvailable?: number | string;
  currentStock?: number | string;
  current_stock?: number | string;
  barcode?: string | null;
  sku?: string | null;
  costPrice?: number | string | null;
  cost_price?: number | string | null;
  minStock?: number | string | null;
  min_stock?: number | string | null;
  conversions?: Array<{
    id?: string;
    conversionId?: string;
    conversion_id?: string;
    presentationName?: string;
    presentation_name?: string;
    conversionRate?: number | string;
    conversion_rate?: number | string;
    salePrice?: number | string;
    sale_price?: number | string;
    barcode?: string | null;
    isActive?: boolean;
    is_active?: boolean;
  }>;
  matchedConversion?: {
    conversionId?: string;
    id?: string;
    presentationName?: string;
    presentation_name?: string;
    conversionRate?: number | string;
    salePrice?: number | string;
    barcode?: string | null;
  } | null;
}

export interface UpdateProductConversionBackendDTO {
  id?: string;
  presentationName: string;
  presentation_name: string;
  conversionRate: number;
  conversion_rate: number;
  salePrice: number;
  sale_price: number;
  barcode?: string | null;
  isActive: boolean;
  is_active: boolean;
}

export interface UpdateProductBackendDTO {
  name: string;
  category_id?: string;
  sku?: string;
  barcode?: string;
  base_unit: string;
  baseUnit: string;
  cost_price: number;
  costPrice: number;
  base_sale_price: number;
  baseSalePrice: number;
  min_stock?: number;
  minStock?: number;
  is_service: boolean;
  isService: boolean;
  is_active: boolean;
  isActive: boolean;
  conversions: UpdateProductConversionBackendDTO[];
}

export interface ProductFormConversionInput {
  id?: string;
  conversionId?: string;
  presentationName: string;
  barcode?: string;
  conversionRate: number | string;
  salePrice: number | string;
}

export type ProductConfigFormPayload = Omit<
  ProductConfigSavePayload,
  "conversions"
> & {
  conversions?: ProductFormConversionInput[];
};

export class CatalogMapper {
  static toUpdatePayload(
    formData: ProductConfigFormPayload,
    originalCategoryId?: string,
  ): UpdateProductBackendDTO {
    const rawCost = Number(formData.costPrice);
    const rawSale = Number(formData.baseSalePrice);
    const rawMinStock = Number(formData.minStock);

    const costPrice = Number.isFinite(rawCost) ? rawCost : 0;
    const baseSalePrice = Number.isFinite(rawSale) ? rawSale : 0;
    const minStock = Number.isFinite(rawMinStock) ? rawMinStock : 0;
    const isService = Boolean(formData.isService);

    return {
      name: formData.name.trim(),
      ...(originalCategoryId ? { category_id: originalCategoryId } : {}),
      sku: formData.sku?.trim() || undefined,
      barcode: formData.barcode?.trim() || undefined,
      base_unit: formData.baseUnit,
      baseUnit: formData.baseUnit,
      cost_price: costPrice,
      costPrice: costPrice,
      base_sale_price: baseSalePrice,
      baseSalePrice: baseSalePrice,
      min_stock: minStock,
      minStock: minStock,
      is_service: isService,
      isService: isService,
      is_active: true,
      isActive: true,
      conversions: (formData.conversions ?? []).map(
        (c: ProductFormConversionInput): UpdateProductConversionBackendDTO => {
          const existingId = c.id ?? c.conversionId;
          const parsedRate = Number(c.conversionRate);
          const parsedPrice = Number(c.salePrice);
          const cleanRate =
            Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 1;
          const cleanPrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
          const cleanName = c.presentationName?.trim() || "";

          return {
            ...(existingId ? { id: existingId } : {}),
            presentationName: cleanName,
            presentation_name: cleanName,
            conversionRate: cleanRate,
            conversion_rate: cleanRate,
            salePrice: cleanPrice,
            sale_price: cleanPrice,
            barcode: c.barcode?.trim() || null,
            isActive: true,
            is_active: true,
          };
        },
      ),
    };
  }

  static calculateStockDeduction(
    quantity: number,
    conversionRate: number,
    isService: boolean,
  ): StockDeductionCalculation {
    if (isService) {
      return {
        quantity,
        conversionRate: 0,
        baseQuantityDeducted: 0,
        isService: true,
      };
    }

    const factor = conversionRate > 0 ? conversionRate : 1;
    const baseQuantityDeducted = Number((quantity * factor).toFixed(4));

    return {
      quantity,
      conversionRate: factor,
      baseQuantityDeducted,
      isService: false,
    };
  }

  static toDomain(dto: ApiProductOutput): CatalogProduct {
    const rawConversions = Array.isArray(dto.conversions)
      ? dto.conversions
      : [];

    const conversions: ProductConversion[] = rawConversions.map((item) => {
      const c = item as Record<string, unknown>;
      const rawBarcode = c.barcode ?? c.barcode_usb ?? c.bar_code ?? null;
      const rawId = c.conversionId ?? c.id ?? c.conversion_id ?? "";
      const rawName = c.presentationName ?? c.presentation_name ?? "";
      const rawRate = Number(c.conversionRate ?? c.conversion_rate ?? 1);
      const rawPrice = Number(c.salePrice ?? c.sale_price ?? 0);

      return {
        conversionId: String(rawId),
        presentationName: String(rawName),
        conversionRate: Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1,
        salePrice: Number.isFinite(rawPrice) ? rawPrice : 0,
        barcode: rawBarcode ? String(rawBarcode).trim() : null,
      };
    });

    const matchedConversion: ProductConversion | null = dto.matchedConversion
      ? {
          conversionId:
            dto.matchedConversion.conversionId ??
            dto.matchedConversion.id ??
            "",
          presentationName:
            dto.matchedConversion.presentationName ??
            dto.matchedConversion.presentation_name ??
            "",
          conversionRate: Number(dto.matchedConversion.conversionRate) || 1,
          salePrice: Number(dto.matchedConversion.salePrice) || 0,
          barcode: dto.matchedConversion.barcode?.trim() ?? null,
        }
      : null;

    // Extracción tolerante y numérica
    const resolvedId = String(dto.productId ?? dto.id ?? "");
    const resolvedIsService = Boolean(dto.isService ?? dto.is_service ?? false);
    const resolvedBaseUnit = String(
      dto.baseUnit ?? dto.base_unit ?? "NIU",
    ).toUpperCase();
    const resolvedSalePrice = Number(
      dto.baseSalePrice ?? dto.base_sale_price ?? 0,
    );
    const resolvedStock = Number(
      dto.stockAvailable ?? dto.currentStock ?? dto.current_stock ?? 0,
    );
    const rawCost = dto.costPrice ?? dto.cost_price;
    const resolvedCostPrice =
      rawCost !== null && rawCost !== undefined ? Number(rawCost) : 0;

    const rawMin = dto.minStock ?? dto.min_stock;
    const resolvedMinStock =
      rawMin !== null && rawMin !== undefined ? Number(rawMin) : 0;

    return {
      productId: resolvedId,
      name: dto.name ?? "",
      isService: resolvedIsService,
      baseUnit: resolvedBaseUnit,
      baseSalePrice: Number.isFinite(resolvedSalePrice) ? resolvedSalePrice : 0,
      stockAvailable: Number.isFinite(resolvedStock) ? resolvedStock : 0,
      barcode: dto.barcode?.trim() ?? null,
      sku: dto.sku?.trim() ?? null,
      costPrice: Number.isFinite(resolvedCostPrice) ? resolvedCostPrice : 0,
      minStock: Number.isFinite(resolvedMinStock) ? resolvedMinStock : 0,
      conversions,
      matchedConversion,
    };
  }
}
