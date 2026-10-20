// src/modules/inventory/components/WarehouseTransferModal.tsx
import { useState } from "react";
import { X, ArrowRightLeft, AlertCircle } from "lucide-react";
import type { CatalogProduct } from "@/modules/catalog/models/catalog.types";
import type { Warehouse } from "../repositories/HttpInventoryRepository";

interface WarehouseTransferModalProps {
  readonly product: CatalogProduct | null;
  readonly warehouses: Warehouse[];
  readonly currentWarehouseId: string;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (data: {
    originWarehouseId: string;
    destinationWarehouseId: string;
    quantity: number;
    notes?: string;
  }) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function WarehouseTransferModal({
  product,
  warehouses,
  currentWarehouseId,
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: WarehouseTransferModalProps) {
  const [destinationId, setDestinationId] = useState<string>(() => {
    const other = warehouses.find(
      (w: Warehouse) => w.id !== currentWarehouseId,
    );
    return other?.id ?? "";
  });
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open || !product) return null;

  const currentWarehouse = warehouses.find(
    (w: Warehouse) => w.id === currentWarehouseId,
  );
  const destinationWarehouses = warehouses.filter(
    (w: Warehouse) => w.id !== currentWarehouseId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Ingrese una cantidad válida mayor a cero.");
      return;
    }

    if (!destinationId) {
      setError("Seleccione un almacén de destino.");
      return;
    }

    try {
      await onConfirm({
        originWarehouseId: currentWarehouseId,
        destinationWarehouseId: destinationId,
        quantity: qty,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al procesar traslado";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2 text-brand">
            <ArrowRightLeft className="h-4 w-4" />
            <h2 className="text-sm font-bold text-foreground">
              Traslado entre Sedes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded border border-border-subtle bg-surface-elevated p-2.5 space-y-1 text-[11px]">
          <div className="font-bold text-foreground truncate">
            {product.name}
          </div>
          <div className="text-foreground-secondary flex justify-between">
            <span>
              Origen:{" "}
              <strong className="text-foreground">
                {currentWarehouse?.name}
              </strong>
            </span>
            <span>
              Stock Disponible:{" "}
              <strong className="text-brand">
                {product.stockAvailable} {product.baseUnit}
              </strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-foreground-secondary mb-1">
              Sede / Almacén de Destino
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2 text-foreground focus:border-brand focus:outline-none"
            >
              {destinationWarehouses.map((w: Warehouse) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.address ? `(${w.address})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-foreground-secondary mb-1">
              Cantidad a Trasladar
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-foreground-secondary mb-1">
              Nota de Guía Interna
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Reabastecimiento de mostrador..."
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground focus:border-brand focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-rose-500 text-[10px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded border border-border-strong text-foreground-secondary hover:bg-surface-elevated"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded bg-brand text-brand-fg font-bold hover:bg-brand-hover active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Procesando..." : "Emitir Traslado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
