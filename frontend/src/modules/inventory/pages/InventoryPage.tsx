// src/modules/inventory/pages/InventoryPage.tsx
import { useState, useMemo } from "react";
import {
  Boxes,
  Warehouse as WarehouseIcon,
  Search,
  ArrowRightLeft,
  Wrench,
  Plus,
} from "lucide-react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useInventory } from "../hooks/useInventory";
import { useCatalogQuery } from "@/modules/catalog/hooks/useCatalogQuery";
import { StockAdjustmentModal } from "../components/StockAdjustmentModal";
import { WarehouseTransferModal } from "../components/WarehouseTransferModal";
import { CreateWarehouseModal } from "../components/CreateWarehouseModal";
import type { CatalogProduct } from "@/modules/catalog/models/catalog.types";
import type {
  Warehouse,
  KardexMovement,
} from "../repositories/HttpInventoryRepository";

export function InventoryPage() {
  const { session } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCreateWarehouseOpen, setIsCreateWarehouseOpen] = useState(false);

  // 1. Cargar almacenes y operaciones
  const {
    warehouses,
    kardex,
    isLoadingKardex,
    recordAdjustment,
    isAdjusting,
    createTransfer,
    isTransferring,
    createWarehouse,
    isCreatingWarehouse,
  } = useInventory(
    selectedProductId ?? undefined,
    selectedWarehouseId || undefined,
  );

  // Lectura robusta de banderas de multi-almacén
  const tenantData = session?.tenant as Record<string, unknown> | undefined;
  const isImpersonating =
    localStorage.getItem("is_impersonating") === "true" ||
    Boolean(localStorage.getItem("superadmin_backup_token"));

  const hasMultiwarehouseModule = Boolean(
    tenantData?.moduleMultiwarehouse ||
    tenantData?.module_multiwarehouse ||
    (tenantData?.modules as Record<string, boolean> | undefined)
      ?.multiwarehouse ||
    (tenantData?.modules as Record<string, boolean> | undefined)?.multiStock ||
    session?.user?.role === "SUPERADMIN" ||
    isImpersonating,
  );

  const canManageMultiwarehouse =
    hasMultiwarehouseModule || warehouses.length > 1;
  // ¿Hay 2 o más sedes registradas para activar selectores y traslados?
  const hasMultipleWarehouses = warehouses.length > 1;

  // 3. Seleccionar almacén activo por defecto
  const activeWarehouse = useMemo<Warehouse | null>(() => {
    if (!warehouses || warehouses.length === 0) return null;
    if (!selectedWarehouseId) {
      return (
        warehouses.find((w: Warehouse) => w.isDefault) ?? warehouses[0] ?? null
      );
    }
    return (
      warehouses.find((w: Warehouse) => w.id === selectedWarehouseId) ??
      warehouses[0] ??
      null
    );
  }, [warehouses, selectedWarehouseId]);

  // 4. Consulta de catálogo para el almacén activo
  const { data: products = [], isLoading: isLoadingProducts } = useCatalogQuery(
    {
      searchTerm,
      warehouseId: activeWarehouse?.id ?? "",
    },
  );

  const activeProduct = useMemo<CatalogProduct | null>(() => {
    if (!products.length) return null;
    return (
      products.find((p: CatalogProduct) => p.productId === selectedProductId) ??
      products[0] ??
      null
    );
  }, [products, selectedProductId]);

  const handleOpenAdjustment = () => {
    if (activeProduct && activeWarehouse) {
      setIsAdjustModalOpen(true);
    }
  };

  const handleOpenTransfer = () => {
    if (activeProduct && activeWarehouse) {
      setIsTransferModalOpen(true);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas p-4 font-mono text-foreground select-none text-xs">
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-strong gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">
              Control de Almacén & Kardex Físico
            </h1>
            <p className="text-[11px] text-foreground-muted">
              Trazabilidad inmutable de movimientos, mermas y existencias en
              tiempo real
            </p>
          </div>
        </div>

        {/* Selector de Sede / Almacén */}
        <div className="flex items-center gap-2">
          <WarehouseIcon className="h-4 w-4 text-brand" />
          {hasMultipleWarehouses ? (
            <select
              value={activeWarehouse?.id ?? ""}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-surface-elevated border border-border-strong rounded px-2.5 py-1 text-foreground focus:border-brand focus:outline-none"
            >
              {warehouses.map((w: Warehouse) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? "(Principal)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <span className="bg-surface-elevated border border-border-strong rounded px-2.5 py-1 text-foreground font-bold">
              {activeWarehouse?.name ?? "Almacén Principal"}
            </span>
          )}

          {canManageMultiwarehouse && (
            <button
              type="button"
              onClick={() => setIsCreateWarehouseOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded border border-brand/40 bg-brand/10 hover:bg-brand hover:text-brand-fg font-bold text-brand transition-all text-[11px]"
              title="Registrar nuevo almacén o sede"
            >
              <Plus className="h-3 w-3" />
              <span>Nueva Sede</span>
            </button>
          )}
        </div>
      </div>

      {/* Espacio Principal: Lista de Productos y Kardex Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Columna Izquierda: Búsqueda y Lista de Productos (5 cols) */}
        <section className="lg:col-span-5 rounded-xl border border-border-strong bg-surface flex flex-col overflow-hidden shadow-elevation">
          <div className="p-2.5 border-b border-border-subtle bg-surface-subtle">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-foreground-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, SKU o nombre..."
                className="w-full h-7 rounded border border-border-strong bg-surface-elevated pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-border-subtle">
            {isLoadingProducts ? (
              <div className="p-6 text-center text-foreground-muted">
                Cargando existencias...
              </div>
            ) : products.length === 0 ? (
              <div className="p-6 text-center text-foreground-muted">
                No se encontraron productos.
              </div>
            ) : (
              products.map((p: CatalogProduct) => {
                const isSelected =
                  (activeProduct?.productId ?? "") === p.productId;
                return (
                  <div
                    key={p.productId}
                    onClick={() => setSelectedProductId(p.productId)}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-brand/10 border-l-4 border-l-brand"
                        : "hover:bg-surface-elevated border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div
                        className={`font-bold truncate ${
                          isSelected ? "text-brand" : "text-foreground"
                        }`}
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px] text-foreground-muted flex items-center gap-2 mt-0.5">
                        <span>SKU: {p.sku || p.barcode || "N/A"}</span>
                        <span>•</span>
                        <span>Unidad: {p.baseUnit}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-foreground font-mono">
                        {p.stockAvailable} {p.baseUnit}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          p.stockAvailable <= (p.minStock ?? 0)
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        {p.stockAvailable <= (p.minStock ?? 0)
                          ? "STOCK BAJO"
                          : "DISPONIBLE"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Columna Derecha: Detalle de Movimientos Kardex (7 cols) */}
        <section className="lg:col-span-7 rounded-xl border border-border-strong bg-surface flex flex-col justify-between overflow-hidden shadow-elevation">
          {activeProduct ? (
            <>
              {/* Encabezado del Producto Seleccionado */}
              <div className="p-3 bg-surface-subtle border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-brand text-brand-fg font-bold px-1.5 py-0.5 rounded">
                      {activeProduct.sku || activeProduct.barcode || "ITEM"}
                    </span>
                    <h2 className="text-sm font-bold text-foreground truncate max-w-sm">
                      {activeProduct.name}
                    </h2>
                  </div>
                  <div className="text-[11px] text-foreground-secondary mt-1">
                    Sede actual:{" "}
                    <strong className="text-brand">
                      {activeWarehouse?.name}
                    </strong>{" "}
                    | Saldo:{" "}
                    <strong className="text-foreground">
                      {kardex?.currentStock ?? activeProduct.stockAvailable}{" "}
                      {activeProduct.baseUnit}
                    </strong>
                  </div>
                </div>

                {/* Botonera de Acciones */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAdjustment}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border-strong bg-surface-elevated hover:bg-surface text-foreground font-bold hover:text-brand transition-all shadow-xs"
                  >
                    <Wrench className="h-3.5 w-3.5 text-amber-500" />
                    <span>Ajuste / Merma</span>
                  </button>

                  {warehouses.length > 1 && (
                    <button
                      type="button"
                      onClick={handleOpenTransfer}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-brand text-brand-fg font-bold hover:bg-brand-hover active:scale-95 transition-all shadow-xs"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Trasladar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabla de Movimientos Kardex */}
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-surface-subtle border-b border-border-subtle text-[10px] uppercase text-foreground-secondary tracking-wider z-10">
                    <tr>
                      <th className="px-3 py-2">Fecha / Hora</th>
                      <th className="px-3 py-2">Tipo de Movimiento</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2 text-right">Saldo Resultante</th>
                      <th className="px-3 py-2">Doc. Ref / Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-mono">
                    {isLoadingKardex ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-foreground-muted"
                        >
                          Consultando movimientos del Kardex...
                        </td>
                      </tr>
                    ) : !kardex || kardex.movements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-foreground-muted"
                        >
                          No se registran movimientos para este ítem en la sede
                          seleccionada.
                        </td>
                      </tr>
                    ) : (
                      kardex.movements.map((m: KardexMovement) => {
                        const isPositive = m.quantity > 0;
                        return (
                          <tr
                            key={m.id}
                            className="h-10 hover:bg-surface-elevated/40 transition-colors"
                          >
                            <td className="px-3 py-1.5 text-foreground-muted whitespace-nowrap">
                              {new Date(m.createdAt).toLocaleString("es-PE", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="font-bold text-foreground">
                                {m.movementType === "SALE" &&
                                  "Venta en Mostrador (POS)"}
                                {m.movementType === "PURCHASE_ENTRY" &&
                                  "Ingreso por Compra"}
                                {m.movementType === "PHYSICAL_ADJUSTMENT" &&
                                  "Ajuste / Conteo"}
                                {m.movementType === "TRANSFER_IN" &&
                                  "Recepción de Traslado (+)"}
                                {m.movementType === "TRANSFER_OUT" &&
                                  "Despacho de Traslado (-)"}
                              </span>
                            </td>
                            <td
                              className={`px-3 py-1.5 text-right font-bold ${
                                isPositive
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {isPositive ? `+${m.quantity}` : m.quantity}
                            </td>
                            <td className="px-3 py-1.5 text-right font-bold text-foreground">
                              {m.balanceAfter}
                            </td>
                            <td className="px-3 py-1.5 text-foreground-secondary truncate max-w-[150px]">
                              {m.referenceDocument || m.notes || "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-foreground-muted">
              Seleccione un producto para ver su trazabilidad.
            </div>
          )}
        </section>
      </div>

      {/* Modales */}
      <StockAdjustmentModal
        product={activeProduct}
        warehouse={activeWarehouse}
        open={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onConfirm={async (data) => {
          if (!activeProduct || !activeWarehouse) return;
          await recordAdjustment({
            productId: activeProduct.productId,
            warehouseId: activeWarehouse.id,
            type: data.quantity > 0 ? "PURCHASE_ENTRY" : "PHYSICAL_ADJUSTMENT",
            quantity: data.quantity,
            reason: data.reason,
            notes: data.notes,
          });
        }}
        isSubmitting={isAdjusting}
      />

      {hasMultipleWarehouses && activeWarehouse && (
        <WarehouseTransferModal
          product={activeProduct}
          warehouses={warehouses}
          currentWarehouseId={activeWarehouse.id}
          open={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onConfirm={async (data) => {
            if (!activeProduct) return;
            await createTransfer({
              originWarehouseId: data.originWarehouseId,
              destinationWarehouseId: data.destinationWarehouseId,
              notes: data.notes,
              items: [
                { productId: activeProduct.productId, quantity: data.quantity },
              ],
            });
          }}
          isSubmitting={isTransferring}
        />
      )}

      {canManageMultiwarehouse && (
        <CreateWarehouseModal
          open={isCreateWarehouseOpen}
          onClose={() => setIsCreateWarehouseOpen(false)}
          onConfirm={async (data) => {
            await createWarehouse(data);
          }}
          isSubmitting={isCreatingWarehouse}
        />
      )}
    </div>
  );
}
