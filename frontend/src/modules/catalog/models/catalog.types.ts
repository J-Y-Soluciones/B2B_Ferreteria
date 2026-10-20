export interface ProductConversion {
  readonly conversionId: string;
  readonly presentationName: string;
  readonly conversionRate: number;
  readonly salePrice: number;
  readonly barcode?: string | null;
}

export interface CatalogProduct {
  readonly productId: string;
  readonly name: string;
  readonly isService: boolean;
  readonly baseUnit: string;
  readonly baseSalePrice: number;
  readonly stockAvailable: number;
  readonly conversions: readonly ProductConversion[];
  readonly matchedConversion?: ProductConversion | null;
  readonly barcode?: string | null;
  readonly sku?: string | null;
  readonly costPrice?: number;
  readonly minStock?: number;
}

export interface StockDeductionCalculation {
  quantity: number;
  conversionRate: number;
  baseQuantityDeducted: number;
  isService: boolean;
}
