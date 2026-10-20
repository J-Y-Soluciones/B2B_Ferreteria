import { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  useWatch,
  type Control,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productConfigSchema,
  type ProductConfigSavePayload,
} from "../schemas/product.schema";
import type { CatalogProduct } from "../models/catalog.types";
import {
  X,
  Trash2,
  Plus,
  Barcode,
  Save,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ProductConfigModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly productToEdit?: CatalogProduct | null;
  readonly onSave: (data: ProductConfigSavePayload) => Promise<void>;
}

function ConversionPreview({
  control,
  index,
  baseUnit,
}: {
  readonly control: Control<ProductConfigSavePayload>;
  readonly index: number;
  readonly baseUnit: string;
}) {
  const rate = useWatch({
    control,
    name: `conversions.${index}.conversionRate`,
    defaultValue: 1,
  });

  return (
    <div className="rounded bg-surface-subtle border border-border-subtle px-2.5 py-1 text-[11px] text-foreground-secondary flex items-center gap-1.5">
      <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
      <span>
        Deducción atómica calculada:{" "}
        <strong className="text-emerald-500">
          {rate || 1} {baseUnit}
        </strong>{" "}
        del inventario base.
      </span>
    </div>
  );
}

export function ProductConfigModal({
  open,
  onClose,
  productToEdit,
  onSave,
}: ProductConfigModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ProductConfigSavePayload>({
    resolver: zodResolver(
      productConfigSchema,
    ) as unknown as Resolver<ProductConfigSavePayload>,
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      isService: false,
      baseUnit: "MTR",
      costPrice: 0,
      baseSalePrice: 0,
      minStock: 10,
      initialStock: 100,
      conversions: [],
    },
  });

  useEffect(() => {
    if (!open) return;

    if (productToEdit) {
      const rawProduct = productToEdit as unknown as Record<string, unknown>;

      const cost =
        rawProduct.costPrice ??
        rawProduct.cost_price ??
        productToEdit.costPrice ??
        0;

      const minStockVal =
        rawProduct.minStock ??
        rawProduct.min_stock ??
        rawProduct.minStockAlert ??
        productToEdit.minStock ??
        0;

      const baseSale =
        rawProduct.baseSalePrice ??
        rawProduct.base_sale_price ??
        productToEdit.baseSalePrice ??
        0;

      const stock =
        rawProduct.currentStock ??
        rawProduct.stockAvailable ??
        productToEdit.stockAvailable ??
        0;

      reset({
        name: productToEdit.name ?? "",
        sku: productToEdit.sku ?? "",
        barcode: productToEdit.barcode ?? "",
        isService: Boolean(productToEdit.isService),
        baseUnit: (productToEdit.baseUnit ?? "MTR").toUpperCase(),
        costPrice: Number(cost) || 0,
        baseSalePrice: Number(baseSale) || 0,
        minStock: Number(minStockVal) || 0,
        initialStock: Number(stock) || 0,
        conversions:
          productToEdit.conversions?.map((c) => ({
            id: c.conversionId,
            conversionId: c.conversionId,
            presentationName: c.presentationName ?? "",
            barcode: c.barcode ?? "",
            conversionRate: Number(c.conversionRate) || 1,
            salePrice: Number(c.salePrice) || 0,
          })) ?? [],
      });
    } else {
      reset({
        name: "",
        sku: "",
        barcode: "",
        isService: false,
        baseUnit: "MTR",
        costPrice: 0,
        baseSalePrice: 0,
        minStock: 10,
        initialStock: 100,
        conversions: [],
      });
    }
  }, [open, productToEdit, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conversions",
  });

  const isService = useWatch({ control, name: "isService" });
  const baseUnit = useWatch({ control, name: "baseUnit" });
  const nameValue = useWatch({ control, name: "name" });
  const baseSalePrice = useWatch({ control, name: "baseSalePrice" });

  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (data: ProductConfigSavePayload) => {
    try {
      setSubmitError(null);
      await onSave(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al procesar la solicitud.";
      setSubmitError(msg);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 font-mono select-none">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-border-strong bg-surface text-foreground shadow-modal flex flex-col">
        {/* Cabecera Técnica */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 bg-surface-subtle">
          <div className="flex items-center gap-2">
            <span className="text-brand font-bold text-sm">
              {productToEdit
                ? "⚙️ Modificar Producto:"
                : "✨ Nuevo Producto / Servicio:"}
            </span>
            <span className="font-bold text-foreground text-sm">
              {nameValue || "Sin Nombre Asignado"}
            </span>
            <span className="rounded bg-brand/10 text-brand border border-brand/30 px-2 py-0.5 text-[10px] font-bold">
              FRACCIONAL B2B
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 sm:p-6 space-y-6 flex-1"
        >
          {submitError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Naturaleza Operativa */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
            <span className="text-foreground-secondary font-bold uppercase tracking-wider">
              Naturaleza Operativa:
            </span>
            <div className="inline-flex rounded-lg border border-border-strong bg-surface-subtle p-1">
              <button
                type="button"
                onClick={() => setValue("isService", false)}
                className={`rounded-md px-3 py-1.5 font-bold transition-all ${
                  !isService
                    ? "bg-brand text-brand-fg shadow"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                ● Bien Físico (Inventariable con Conversión)
              </button>
              <button
                type="button"
                onClick={() => setValue("isService", true)}
                className={`rounded-md px-3 py-1.5 font-bold transition-all ${
                  isService
                    ? "bg-indigo-600 text-white shadow"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                ● Servicio Intangible (Mano de Obra / Sin Stock)
              </button>
            </div>
          </div>

          {/* 1. Datos Maestros */}
          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4 space-y-3">
            <div className="text-xs font-bold uppercase text-brand tracking-wider">
              1. Datos Maestros e Identificación
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-6">
                <label className="text-[11px] uppercase text-foreground-secondary">
                  Nombre Comercial *
                </label>
                <input
                  {...register("name")}
                  placeholder="Ej: Cable Vulcanizado 2x14 AWG Indeco"
                  className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
                {errors.name && (
                  <span className="text-[10px] text-rose-500 mt-1 block">
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="text-[11px] uppercase text-foreground-secondary">
                  SKU Interno (Clave)
                </label>
                <input
                  {...register("sku")}
                  placeholder={
                    isService ? "Ej: SRV-CORTE" : "Ej: CBL-VULC-2X14"
                  }
                  className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="text-[11px] uppercase text-foreground-secondary flex items-center gap-1">
                  <Barcode className="h-3.5 w-3.5 text-emerald-500" />
                  Barcode USB{" "}
                  {isService && (
                    <span className="text-[9px] text-indigo-400 font-normal">
                      (Rápido)
                    </span>
                  )}
                </label>
                <input
                  {...register("barcode")}
                  placeholder="Escanear o escribir..."
                  className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-emerald-500 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {!isService && (
              <div className="pt-2">
                <label className="text-[11px] uppercase text-foreground-secondary block mb-1.5">
                  Unidad Indivisible Base (Stock Ledger)*
                </label>
                <Controller
                  control={control}
                  name="baseUnit"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { code: "MTR", label: "Metros (MTR)" },
                        { code: "NIU", label: "Unidades (NIU)" },
                        { code: "KGM", label: "Kilos (KGM)" },
                        { code: "LTR", label: "Litros (LTR)" },
                        { code: "BOLSA", label: "Bolsa (BOLSA)" },
                        { code: "GALON", label: "Galón (GALON)" },
                      ].map((u) => (
                        <button
                          key={u.code}
                          type="button"
                          onClick={() => field.onChange(u.code)}
                          className={`rounded border p-2 text-left font-bold transition-all ${
                            field.value?.toUpperCase() === u.code
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-border-strong bg-surface-elevated text-foreground-secondary hover:text-foreground"
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            )}
          </div>

          {/* 2. Precios y Stock */}
          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-brand tracking-wider">
              <span>2. Costos, Venta Base y Umbral de Quiebre</span>
              {productToEdit && !isService && (
                <span className="text-emerald-500">
                  Stock Actual:{" "}
                  {Number(productToEdit.stockAvailable || 0).toFixed(2)}{" "}
                  {baseUnit}
                </span>
              )}
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-4">
                <label className="text-[11px] uppercase text-foreground-secondary">
                  Precio Costo (Promedio)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1.5 text-xs text-foreground-muted">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("costPrice", { valueAsNumber: true })}
                    className="w-full rounded border border-border-strong bg-surface-elevated pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                  />
                </div>
              </div>

              <div className="col-span-12 sm:col-span-4">
                <label className="text-[11px] uppercase text-foreground-secondary">
                  Precio Venta Base (x {baseUnit}) *
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1.5 text-xs text-brand font-bold">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("baseSalePrice", { valueAsNumber: true })}
                    className="w-full rounded border border-border-strong bg-surface-elevated pl-8 pr-3 py-1.5 text-xs text-brand font-bold focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                  />
                </div>
              </div>

              {!isService && (
                <>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="text-[11px] uppercase text-foreground-secondary">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      step="1"
                      {...register("minStock", { valueAsNumber: true })}
                      className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                    />
                  </div>

                  {!productToEdit && (
                    <div className="col-span-6 sm:col-span-2">
                      <label className="text-[11px] uppercase text-foreground-secondary">
                        Stock Inicial
                      </label>
                      <input
                        type="number"
                        step="1"
                        {...register("initialStock", { valueAsNumber: true })}
                        className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-emerald-500 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 3. Conversiones */}
          {!isService && (
            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase text-brand tracking-wider">
                    3. Presentaciones Comerciales Derivadas
                  </div>
                  <div className="text-[10px] text-foreground-muted">
                    Mapeo de unidades fraccionarias para mostrador.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      presentationName: "",
                      barcode: "",
                      conversionRate: 1,
                      salePrice: Number(baseSalePrice) || 0,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded bg-brand/10 border border-brand/30 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand hover:text-brand-fg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />+ Agregar Presentación
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="rounded border border-dashed border-border-strong p-6 text-center text-xs text-foreground-muted">
                  Este producto solo se despachará en su unidad base ({baseUnit}
                  ).
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="rounded border border-border-strong bg-surface-elevated p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand">
                          DERIVADA #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-foreground-muted hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-2 text-xs">
                        <div className="col-span-12 sm:col-span-4">
                          <label className="text-[10px] uppercase text-foreground-secondary">
                            Presentación
                          </label>
                          <input
                            {...register(`conversions.${idx}.presentationName`)}
                            placeholder="Ej: Rollo x 50 Metros"
                            className="mt-1 w-full rounded border border-border-strong bg-surface px-2 py-1 text-foreground font-mono"
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label className="text-[10px] uppercase text-foreground-secondary">
                            Barcode USB (Único)
                          </label>
                          <input
                            {...register(`conversions.${idx}.barcode`)}
                            placeholder="Opcional / Escanear..."
                            className="mt-1 w-full rounded border border-border-strong bg-surface px-2 py-1 text-emerald-500 font-mono font-bold"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-2">
                          <label className="text-[10px] uppercase text-foreground-secondary">
                            Factor (x {baseUnit})
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            {...register(`conversions.${idx}.conversionRate`, {
                              valueAsNumber: true,
                            })}
                            className="mt-1 w-full rounded border border-border-strong bg-surface px-2 py-1 text-foreground font-mono font-bold"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-3">
                          <label className="text-[10px] uppercase text-foreground-secondary">
                            Precio Venta (S/)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`conversions.${idx}.salePrice`, {
                              valueAsNumber: true,
                            })}
                            className="mt-1 w-full rounded border border-border-strong bg-surface px-2 py-1 text-brand font-mono font-bold"
                          />
                        </div>
                      </div>

                      <ConversionPreview
                        control={control}
                        index={idx}
                        baseUnit={baseUnit}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-foreground-secondary hover:text-foreground"
            >
              [ESC] Descartar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-xs font-bold text-brand-fg shadow-lg hover:bg-brand-hover disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Producto [ENTER]"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
