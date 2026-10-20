export interface FormattedConversionOutput {
  conversionId: string;
  presentationName: string;
  conversionRate: number;
  salePrice: number;
  barcode: string | null;
}

export interface FormattedProductOutput {
  id: string; // ✅ Añadido para compatibilidad directa con tablas/formularios del front
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  isService: boolean;
  baseUnit: string;
  costPrice: number; // 👈 ✅ PRECIO COSTO
  baseSalePrice: number;
  currentStock: number; // 👈 ✅ STOCK ACTUAL
  stockAvailable: number;
  minStock: number; // 👈 ✅ STOCK MÍNIMO
  conversions: FormattedConversionOutput[];
  matchedConversion: FormattedConversionOutput | null;
}

export function formatProductResponse(product: any): FormattedProductOutput {
  if (!product) {
    throw new Error("No se proporcionó un producto válido para serializar.");
  }

  const rawConv = product.matchedConversion ?? product.matched_conversion;

  let matchedConversion: FormattedConversionOutput | null = null;
  if (rawConv) {
    matchedConversion = {
      conversionId: String(
        rawConv.conversionId ?? rawConv.conversion_id ?? rawConv.id ?? "",
      ),
      presentationName: String(
        rawConv.presentationName ?? rawConv.presentation_name ?? "Presentación",
      ),
      conversionRate: Number(
        rawConv.conversionRate ?? rawConv.conversion_rate ?? 1,
      ),
      salePrice: Number(rawConv.salePrice ?? rawConv.sale_price ?? 0),
      barcode: rawConv.barcode ? String(rawConv.barcode) : null,
    };
  }

  const rawConversionsList = Array.isArray(product.conversions)
    ? product.conversions
    : [];
  const conversions: FormattedConversionOutput[] = rawConversionsList.map(
    (c: any) => ({
      conversionId: String(c.conversionId ?? c.conversion_id ?? c.id ?? ""),
      presentationName: String(
        c.presentationName ?? c.presentation_name ?? "Presentación",
      ),
      conversionRate: Number(c.conversionRate ?? c.conversion_rate ?? 1),
      salePrice: Number(c.salePrice ?? c.sale_price ?? 0),
      barcode: c.barcode ? String(c.barcode) : null,
    }),
  );

  const resolvedId = String(
    product.productId ?? product.product_id ?? product.id ?? "",
  );
  const resolvedStock = Number(
    product.currentStock ??
      product.current_stock ??
      product.stockAvailable ??
      product.stock_available ??
      0,
  );

  return {
    id: resolvedId,
    productId: resolvedId,
    name: String(product.name ?? ""),
    sku: product.sku ?? null,
    barcode: product.barcode ?? null,
    isService: Boolean(product.isService ?? product.is_service ?? false),
    baseUnit: String(product.baseUnit ?? product.base_unit ?? "UND"),
    costPrice: Number(product.costPrice ?? product.cost_price ?? 0), // 👈 Mapeo de costPrice
    baseSalePrice: Number(
      product.baseSalePrice ??
        product.base_sale_price ??
        product.salePrice ??
        product.sale_price ??
        0,
    ),
    currentStock: resolvedStock,
    stockAvailable: resolvedStock,
    minStock: Number(product.minStock ?? product.min_stock ?? 0), // 👈 Mapeo de minStock
    conversions,
    matchedConversion,
  };
}
