import type { CatalogProduct } from "../models/catalog.types";

interface ProductScanResultCardProps {
  readonly product: CatalogProduct;
}

export function ProductScanResultCard({ product }: ProductScanResultCardProps) {
  const currentPrice = product.matchedConversion
    ? product.matchedConversion.salePrice
    : product.baseSalePrice;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-strong bg-surface p-4 font-mono shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{product.name}</h3>
          <span className="text-xs text-foreground-muted">
            Presentación:{" "}
            {product.matchedConversion?.presentationName ?? product.baseUnit}
          </span>
        </div>
        <div className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500">
          Stock: {product.stockAvailable.toFixed(2)} {product.baseUnit}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-xs">
        <span className="text-foreground-secondary">
          {product.matchedConversion
            ? `Factor: x${product.matchedConversion.conversionRate}`
            : "Venta por Unidad Base"}
        </span>
        <span className="text-base font-black text-amber-500">
          S/ {currentPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
