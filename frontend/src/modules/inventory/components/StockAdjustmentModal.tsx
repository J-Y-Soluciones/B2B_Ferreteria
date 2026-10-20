// src/modules/inventory/components/StockAdjustmentModal.tsx
import { useState } from "react";
import {
  X,
  Wrench,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { CatalogProduct } from "@/modules/catalog/models/catalog.types";
import type {
  Warehouse,
  AdjustmentReason,
} from "../repositories/HttpInventoryRepository";

interface StockAdjustmentModalProps {
  readonly product: CatalogProduct | null;
  readonly warehouse: Warehouse | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (data: {
    quantity: number;
    reason: AdjustmentReason;
    notes?: string;
  }) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function StockAdjustmentModal({
  product,
  warehouse,
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: StockAdjustmentModalProps) {
  const [direction, setDirection] = useState<"IN" | "OUT">("OUT");
  const [amount, setAmount] = useState<string>("1");
  const [reason, setReason] = useState<AdjustmentReason>("COUNT_DISCREPANCY");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open || !product || !warehouse) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNumber = Number(amount);
    if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) {
      setError("La cantidad debe ser un número mayor a cero.");
      return;
    }

    const finalQuantity = direction === "IN" ? qtyNumber : -qtyNumber;

    try {
      await onConfirm({
        quantity: finalQuantity,
        reason,
        notes: notes.trim() || undefined,
      });
      onClose();
      setAmount("1");
      setNotes("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al procesar ajuste";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2 text-brand">
            <Wrench className="h-4 w-4" />
            <h2 className="text-sm font-bold text-foreground">
              Ajuste Manual de Existencias
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
              Sede:{" "}
              <strong className="text-foreground">{warehouse.name}</strong>
            </span>
            <span>
              Stock Actual:{" "}
              <strong className="text-brand">
                {product.stockAvailable} {product.baseUnit}
              </strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDirection("IN");
                setReason("PURCHASE_RECEIPT");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded border font-bold transition-all ${
                direction === "IN"
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                  : "bg-surface-elevated border-border-strong text-foreground-muted hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              <span>Ingreso (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("OUT");
                setReason("DAMAGE");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded border font-bold transition-all ${
                direction === "OUT"
                  ? "bg-rose-500/15 border-rose-500 text-rose-400"
                  : "bg-surface-elevated border-border-strong text-foreground-muted hover:text-foreground"
              }`}
            >
              <ArrowDownRight className="h-4 w-4 text-rose-400" />
              <span>Salida / Merma (-)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-foreground-secondary mb-1">
                Cantidad
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-foreground-secondary mb-1">
                Motivo
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2 text-foreground focus:border-brand focus:outline-none text-[11px]"
              >
                {direction === "OUT" ? (
                  <>
                    <option value="DAMAGE">Merma / Daño Físico</option>
                    <option value="EXPIRATION">Vencimiento</option>
                    <option value="COUNT_DISCREPANCY">
                      Faltante por Conteo
                    </option>
                  </>
                ) : (
                  <>
                    <option value="PURCHASE_RECEIPT">Ingreso por Compra</option>
                    <option value="COUNT_DISCREPANCY">
                      Sobrante por Conteo
                    </option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-foreground-secondary mb-1">
              Observaciones / Justificación
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Rotura en pasillo / bolsa dañada..."
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground focus:border-brand focus:outline-none text-[11px]"
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
              {isSubmitting ? "Guardando..." : "Confirmar Ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
