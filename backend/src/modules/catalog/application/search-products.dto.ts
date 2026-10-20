export interface SearchProductsQuery {
  tenantId: string;
  term: string;
  warehouseId?: string;
  limit?: number;
}

export interface ProductConversionItemDto {
  conversionId: string;
  presentationName: string;
  conversionRate: number;
  salePrice: number;
  barcode?: string | null;
}

export interface SearchProductItemDto {
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  baseUnit: string;
  costPrice: number; // 👈 Agregado
  baseSalePrice: number;
  isService: boolean;
  currentStock: number; // 👈 Alias alineado
  stockAvailable: number;
  minStock: number; // 👈 Agregado
  conversions: ProductConversionItemDto[];
  matchedConversion: ProductConversionItemDto | null;
}
