import { useState, useMemo } from "react";
import { catalogRepository } from "../repositories/HttpCatalogRepository";
import { useCatalogQuery } from "../hooks/useCatalogQuery";
import { CatalogTableSkeleton } from "../components/skeletons/CatalogTableSkeleton";
import type { CatalogProduct } from "../models/catalog.types";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { ProductConfigModal } from "../components/ProductConfigModal";
import type { ProductConfigSavePayload } from "../schemas/product.schema";
import { StockMovementModal } from "../../inventory/components/StockMovementModal";
import {
  Search,
  Package,
  Wrench,
  Plus,
  Layers,
  Barcode,
  Edit2,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { CatalogMapper } from "../dtos/catalog.mapper";

type FilterType = "ALL" | "PHYSICAL" | "SERVICE";

export function CatalogPage() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === "TENANT_ADMIN";
  const queryClient = useQueryClient();
  const currentWarehouseId =
    session?.defaultWarehouseId ?? "11111111-cccc-4ccc-8ccc-111111111111";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [stockMovementProduct, setStockMovementProduct] =
    useState<CatalogProduct | null>(null);

  // Consulta tipada de TanStack Query v5
  const { data: products = [], isLoading } = useCatalogQuery({
    searchTerm,
    warehouseId: currentWarehouseId,
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterType === "PHYSICAL") return !p.isService;
      if (filterType === "SERVICE") return p.isService;
      return true;
    });
  }, [products, filterType]);

  const activeProduct = selectedProduct ?? filteredProducts[0] ?? null;

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: CatalogProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (payload: ProductConfigSavePayload) => {
    if (editingProduct) {
      const categoryId =
        "categoryId" in editingProduct &&
        typeof (editingProduct as { categoryId?: unknown }).categoryId ===
          "string"
          ? (editingProduct as { categoryId: string }).categoryId
          : "11111111-2222-3333-4444-555555555555";

      // Preservar conversionId existente
      const formPayloadWithConversionIds = {
        ...payload,
        conversions: payload.conversions.map((conv, index) => ({
          ...conv,
          id: editingProduct.conversions?.[index]?.conversionId,
        })),
      };

      const backendPayload = CatalogMapper.toUpdatePayload(
        formPayloadWithConversionIds,
        categoryId,
      );

      await catalogRepository.updateProduct(
        editingProduct.productId,
        backendPayload,
      );
    } else {
      await catalogRepository.createProduct(payload);
    }

    await queryClient.invalidateQueries({ queryKey: ["catalog"] });
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas p-3 sm:p-4 font-mono select-none">
      {/* Cabecera */}
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-subtle pb-3 gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground">
            Maestro de Catálogo y Reglas de Fraccionamiento
          </h1>
          <p className="text-xs text-foreground-secondary">
            Existencias base, factores de conversión y servicios intangibles.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto / Servicio
          </button>
        )}
      </div>

      {/* Buscador y Filtros */}
      <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, Barcode o Nombre (F2)..."
            className="w-full rounded-lg border border-border-strong bg-surface-elevated py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
          />
        </div>

        <div className="flex rounded-lg border border-border-strong bg-surface p-1 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`rounded px-3 py-1 font-semibold transition-colors shrink-0 ${
              filterType === "ALL"
                ? "bg-brand text-brand-fg font-bold"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("PHYSICAL")}
            className={`flex items-center gap-1 rounded px-3 py-1 font-semibold transition-colors shrink-0 ${
              filterType === "PHYSICAL"
                ? "bg-brand text-brand-fg font-bold"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Bienes Físicos
          </button>
          <button
            type="button"
            onClick={() => setFilterType("SERVICE")}
            className={`flex items-center gap-1 rounded px-3 py-1 font-semibold transition-colors shrink-0 ${
              filterType === "SERVICE"
                ? "bg-brand text-brand-fg font-bold"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Servicios
          </button>
        </div>
      </div>

      {/* Grilla Principal */}
      <div className="grid flex-1 grid-cols-12 gap-4 overflow-hidden">
        {/* Tabla 65% */}
        <div className="col-span-12 xl:col-span-8 flex flex-col rounded-xl border border-border-strong bg-surface overflow-hidden shadow-elevation">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-border-subtle bg-surface-subtle text-[11px] uppercase text-foreground-secondary z-10">
                <tr>
                  <th className="p-3">Producto / Identificación</th>
                  <th className="p-3 text-center">Tipo</th>
                  <th className="p-3 text-center">Und. Base</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3 text-right">P. Base</th>
                  <th className="p-3 text-center">Conversiones</th>
                  {isAdmin && (
                    <th className="p-3 text-center w-24">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isLoading ? (
                  <CatalogTableSkeleton rows={5} columnsCount={7} />
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-foreground-muted"
                    >
                      No se encontraron productos bajo este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = activeProduct?.productId === p.productId;
                    return (
                      <tr
                        key={p.productId}
                        onClick={() => setSelectedProduct(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-amber-500/15"
                            : "hover:bg-surface-elevated"
                        }`}
                      >
                        <td
                          className={`p-3 transition-all ${
                            isSelected
                              ? "border-l-4 border-l-amber-500"
                              : "border-l-4 border-l-transparent"
                          }`}
                        >
                          <p
                            className={`font-bold transition-colors ${
                              isSelected ? "text-amber-400" : "text-foreground"
                            }`}
                          >
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            <span className="inline-flex items-center gap-1 rounded bg-surface-elevated px-1.5 py-0.5 border border-border-subtle text-emerald-400 font-bold font-mono">
                              <Barcode className="h-3 w-3" />
                              {p.barcode || "Sin Código"}
                            </span>
                            {p.sku && (
                              <span className="text-foreground-muted font-mono">
                                SKU: {p.sku}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          {p.isService ? (
                            <Badge intent="indigo">Servicio</Badge>
                          ) : (
                            <Badge intent="neutral">Físico</Badge>
                          )}
                        </td>

                        <td className="p-3 text-center font-bold text-foreground-secondary">
                          {p.baseUnit}
                        </td>

                        <td className="p-3 text-right">
                          {p.isService ? (
                            <span className="text-foreground-muted">--</span>
                          ) : (
                            <span
                              className={`font-bold ${
                                p.stockAvailable <= 10
                                  ? "text-rose-500"
                                  : "text-emerald-500"
                              }`}
                            >
                              {p.stockAvailable.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right font-bold text-amber-500">
                          S/ {p.baseSalePrice.toFixed(2)}
                        </td>

                        <td className="p-3 text-center">
                          {p.conversions && p.conversions.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                              <Layers className="h-3 w-3" />
                              {p.conversions.length} Derivadas
                            </span>
                          ) : (
                            <span className="text-foreground-muted text-[11px]">
                              Unidad Base
                            </span>
                          )}
                        </td>

                        {isAdmin && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!p.isService && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStockMovementProduct(p);
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                                  title="Ingreso de Stock a Kardex"
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                  Stock
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(p);
                                }}
                                className="rounded p-1 text-foreground-muted hover:text-amber-400 transition-colors"
                                title="Configurar producto y conversiones"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Lateral 35% */}
        <div className="col-span-12 xl:col-span-4 flex flex-col rounded-xl border border-border-strong bg-surface p-4 shadow-elevation overflow-y-auto justify-between border-t xl:border-t-0">
          {activeProduct ? (
            <div className="flex flex-col gap-4">
              <div className="border-b border-border-subtle pb-3">
                <span className="text-[10px] font-bold uppercase text-foreground-secondary">
                  Vista Previa del Ítem
                </span>
                <h2 className="mt-1 text-base font-bold text-foreground">
                  {activeProduct.name}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  {activeProduct.isService ? (
                    <Badge intent="indigo">Servicio Intangible</Badge>
                  ) : (
                    <Badge intent="emerald">Bien Físico</Badge>
                  )}
                  <span className="text-xs text-foreground-secondary">
                    Unidad Base:{" "}
                    <strong className="text-foreground">
                      {activeProduct.baseUnit}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border-subtle bg-surface-subtle p-3">
                <div>
                  <span className="text-[10px] text-foreground-secondary uppercase">
                    Precio Base
                  </span>
                  <p className="text-lg font-bold text-amber-500">
                    S/ {activeProduct.baseSalePrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-foreground-secondary uppercase">
                    Stock en Almacén
                  </span>
                  <p className="text-lg font-bold text-emerald-500">
                    {activeProduct.isService
                      ? "--"
                      : `${activeProduct.stockAvailable.toFixed(2)} ${activeProduct.baseUnit}`}
                  </p>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase text-foreground-secondary flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-500" />
                  Presentaciones y Reglas de Conversión
                </span>

                {activeProduct.conversions &&
                activeProduct.conversions.length > 0 ? (
                  <div className="space-y-2">
                    {activeProduct.conversions.map((conv) => (
                      <div
                        key={conv.conversionId}
                        className="rounded-lg border border-border-strong bg-surface-elevated p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            {conv.presentationName}
                          </span>
                          <span className="font-bold text-amber-500">
                            S/ {conv.salePrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="rounded bg-amber-500/10 p-2 text-[11px] text-amber-500 border border-amber-500/20">
                          💡 <strong>Regla:</strong> Al vender 1{" "}
                          {conv.presentationName}, se descontarán{" "}
                          <strong>
                            {conv.conversionRate} {activeProduct.baseUnit}
                          </strong>{" "}
                          del inventario.
                          {conv.barcode && (
                            <span className="block mt-1 font-mono text-emerald-400">
                              Barcode USB: {conv.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border-strong p-4 text-center text-xs text-foreground-muted">
                    Este producto solo se despacha en su unidad base (
                    {activeProduct.baseUnit}).
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
              Selecciona un producto para ver sus detalles.
            </div>
          )}

          {activeProduct && (
            <div className="mt-4 flex flex-col gap-2">
              {!activeProduct.isService && isAdmin && (
                <button
                  type="button"
                  onClick={() => setStockMovementProduct(activeProduct)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600/30 transition-all"
                >
                  <ArrowUpRight className="h-4 w-4" />+ Ingresar Stock a Kardex
                </button>
              )}

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(activeProduct)}
                  className="w-full rounded-lg bg-surface-elevated border border-border-strong py-2 text-xs font-bold text-foreground hover:bg-surface-subtle transition-all"
                >
                  Configurar Conversiones y Precios
                </button>
              ) : (
                <div className="w-full py-2 rounded-lg border border-border-subtle bg-surface-subtle text-center text-[11px] text-foreground-muted">
                  Modo Consulta • Solo Lectura
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <ProductConfigModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
        onSave={handleSaveProduct}
      />
      <StockMovementModal
        open={Boolean(stockMovementProduct)}
        product={stockMovementProduct}
        warehouseId={currentWarehouseId}
        onClose={() => setStockMovementProduct(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["catalog"] });
        }}
      />
    </div>
  );
}
