import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMovementFormSchema,
  type CreateMovementFormData,
} from "../schemas/inventoryMovement.schema";
import { useCreateInventoryMovement } from "../hooks/useCreateInventoryMovement";
import type { CatalogProduct } from "../../catalog/models/catalog.types";
import {
  X,
  Truck,
  Wrench,
  Save,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

interface StockMovementModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly product: CatalogProduct | null;
  readonly warehouseId: string;
  readonly onSuccess?: () => void;
}

export function StockMovementModal({
  open,
  onClose,
  product,
  warehouseId,
  onSuccess,
}: StockMovementModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMovementMutation = useCreateInventoryMovement();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMovementFormData>({
    resolver: zodResolver(
      createMovementFormSchema,
    ) as unknown as Resolver<CreateMovementFormData>,
    defaultValues: {
      movementType: "PURCHASE_ENTRY",
      quantity: 1,
      unitCost: product?.costPrice || 0,
      documentNumber: "",
      providerName: "",
      reason: "",
    },
  });

  const selectedType = useWatch({ control, name: "movementType" });
  const quantityValue = useWatch({ control, name: "quantity" }) || 0;

  if (!open || !product) return null;

  const handleClose = () => {
    setSubmitError(null);
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateMovementFormData) => {
    try {
      setSubmitError(null);

      let finalReason = data.reason;
      if (data.movementType === "PURCHASE_ENTRY") {
        const doc = data.documentNumber
          ? `Doc: ${data.documentNumber}`
          : "Sin Doc";
        const prov = data.providerName ? `Prov: ${data.providerName}` : "";
        finalReason = `Compra [${doc}${prov ? ` | ${prov}` : ""}] - ${data.reason}`;
      }

      await createMovementMutation.mutateAsync({
        warehouseId,
        productId: product.productId,
        movementType: data.movementType,
        quantity: data.quantity,
        unitCost: data.unitCost,
        reason: finalReason,
      });

      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al registrar el movimiento en Kardex.";
      setSubmitError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-xl rounded-xl border border-border-strong bg-surface text-foreground shadow-modal flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 bg-surface-subtle">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm text-foreground">
              Abastecimiento / Ingreso a Kardex
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumen del Producto */}
        <div className="px-6 py-3 bg-surface-elevated/60 border-b border-border-subtle flex justify-between items-center text-xs">
          <div>
            <div className="text-foreground-secondary text-[10px] uppercase font-bold">
              Producto Seleccionado
            </div>
            <div className="font-bold text-brand">{product.name}</div>
          </div>
          <div className="text-right">
            <div className="text-foreground-secondary text-[10px] uppercase font-bold">
              Stock Actual
            </div>
            <div className="font-bold text-emerald-400">
              {product.stockAvailable.toFixed(2)} {product.baseUnit}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {submitError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Tipo de Operación */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-foreground-secondary">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setValue("movementType", "PURCHASE_ENTRY");
                  setValue("reason", "Ingreso por factura de compra");
                }}
                className={`p-2.5 rounded-lg border flex items-center gap-2 transition-all text-left ${
                  selectedType === "PURCHASE_ENTRY"
                    ? "border-brand bg-brand/10 text-brand font-bold shadow"
                    : "border-border-strong bg-surface-subtle text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Truck className="h-4 w-4 shrink-0" />
                <div>
                  <div className="leading-tight">Compra / Proveedor</div>
                  <div className="text-[9px] opacity-70">Factura o Boleta</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue("movementType", "POSITIVE_ADJUSTMENT");
                  setValue("reason", "Reposición manual / conteo físico");
                }}
                className={`p-2.5 rounded-lg border flex items-center gap-2 transition-all text-left ${
                  selectedType === "POSITIVE_ADJUSTMENT" ||
                  selectedType === "INITIAL_STOCK"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow"
                    : "border-border-strong bg-surface-subtle text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Wrench className="h-4 w-4 shrink-0" />
                <div>
                  <div className="leading-tight">Reposición Manual</div>
                  <div className="text-[9px] opacity-70">
                    Ajuste de inventario
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Campos para Factura si es Compra */}
          {selectedType === "PURCHASE_ENTRY" && (
            <div className="grid grid-cols-12 gap-3 p-3 rounded-lg border border-border-subtle bg-surface-subtle">
              <div className="col-span-6">
                <label className="text-[10px] uppercase text-foreground-secondary">
                  N° Factura / Boleta
                </label>
                <input
                  {...register("documentNumber")}
                  placeholder="Ej: F001-002934"
                  className="mt-1 w-full rounded border border-border-strong bg-surface px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="col-span-6">
                <label className="text-[10px] uppercase text-foreground-secondary">
                  Proveedor
                </label>
                <input
                  {...register("providerName")}
                  placeholder="Ej: Indeco S.A."
                  className="mt-1 w-full rounded border border-border-strong bg-surface px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {/* Cantidad y Costo */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="text-[11px] uppercase font-bold text-foreground-secondary">
                Cantidad a Ingresar ({product.baseUnit}) *
              </label>
              <input
                type="number"
                step="0.0001"
                {...register("quantity")}
                className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-2 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              {errors.quantity && (
                <span className="text-[10px] text-rose-500 mt-1 block">
                  {errors.quantity.message}
                </span>
              )}
            </div>

            <div className="col-span-6">
              <label className="text-[11px] uppercase font-bold text-foreground-secondary">
                Costo Unitario (S/ x {product.baseUnit})
              </label>
              <input
                type="number"
                step="0.01"
                {...register("unitCost")}
                className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Glosa */}
          <div>
            <label className="text-[11px] uppercase font-bold text-foreground-secondary">
              Motivo / Observación *
            </label>
            <input
              {...register("reason")}
              placeholder="Ej: Ingreso por guía de remisión / Lote nuevo"
              className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.reason && (
              <span className="text-[10px] text-rose-500 mt-1 block">
                {errors.reason.message}
              </span>
            )}
          </div>

          {/* Proyección */}
          <div className="rounded-lg bg-surface-subtle border border-border-subtle p-3 text-xs flex justify-between items-center">
            <span className="text-foreground-secondary">
              Nuevo Stock Proyectado:
            </span>
            <span className="font-bold text-emerald-400 text-sm">
              {(product.stockAvailable + (Number(quantityValue) || 0)).toFixed(
                2,
              )}{" "}
              {product.baseUnit}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-foreground-secondary hover:text-foreground"
            >
              [ESC] Cancelar
            </button>
            <button
              type="submit"
              disabled={createMovementMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition-all"
            >
              <Save className="h-4 w-4" />
              {createMovementMutation.isPending
                ? "Registrando en Kardex..."
                : "Registrar Entrada [ENTER]"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
