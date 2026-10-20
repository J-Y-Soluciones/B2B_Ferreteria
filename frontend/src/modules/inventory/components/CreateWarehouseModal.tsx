// src/modules/inventory/components/CreateWarehouseModal.tsx
import { useState } from "react";
import { Warehouse as WarehouseIcon, X, Plus, AlertCircle } from "lucide-react";

interface CreateWarehouseModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (data: {
    name: string;
    address?: string;
  }) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function CreateWarehouseModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: CreateWarehouseModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la sede o almacén es obligatorio.");
      return;
    }

    try {
      await onConfirm({
        name: name.trim(),
        address: address.trim() || undefined,
      });
      setName("");
      setAddress("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear la sede";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono text-xs">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2 text-brand">
            <WarehouseIcon className="h-4 w-4" />
            <h2 className="text-sm font-bold text-foreground">
              Nueva Sede / Almacén
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-foreground-secondary mb-1">
              Nombre de la Sede / Sucursal *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Patio de Materiales / Almacén Fierros"
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-foreground-secondary mb-1">
              Dirección o Referencia Física (Opcional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Canto Grande 123"
              className="w-full h-8 rounded border border-border-strong bg-surface-elevated px-2.5 text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand text-brand-fg font-bold hover:bg-brand-hover active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Guardando..." : "Registrar Sede"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
