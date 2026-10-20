export interface ScanProductQuery {
  tenantId: string;
  barcode: string;
  warehouseId?: string;
}

export interface MatchedConversionDto {
  conversionId: string;
  presentationName: string;
  conversionRate: number;
  salePrice: number;
}

export interface ScanProductResult {
  productId: string;
  name: string;
  isService: boolean;
  baseUnit: string;
  matchedConversion: MatchedConversionDto | null;
  salePrice: number;
  stockAvailable: number;
}
