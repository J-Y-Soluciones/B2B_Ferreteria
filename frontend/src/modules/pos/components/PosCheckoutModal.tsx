// src/modules/pos/components/PosCheckoutModal.tsx
import { useEffect, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import type { CustomerCreditProfile } from "@/modules/customers/models/customer.types";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "../schemas/checkout.schemas";
import type { PaymentSplit, FiscalDispatchInfo } from "../models/pos.types";
import { AlertTriangle, Lock } from "lucide-react";

interface PosCheckoutModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly total: number;
  readonly customer: CustomerCreditProfile | null;
  readonly onConfirmSale: (
    payments: PaymentSplit[],
    fiscal: FiscalDispatchInfo | null,
  ) => Promise<void>;
  readonly isProcessing: boolean;
}

export function PosCheckoutModal({
  open,
  onOpenChange,
  total,
  customer,
  onConfirmSale,
  isProcessing,
}: PosCheckoutModalProps) {
  const cashInputRef = useRef<HTMLInputElement>(null);
  const isOverSunatLimit = total >= 700;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      cashAmount: total,
      cashTendered: total,
      cardAmount: 0,
      cardReference: "",
      yapePlinAmount: 0,
      yapeReference: "",
      creditAmount: 0,
      requiresInvoice: isOverSunatLimit,
      docType: "03",
      customerDocNumber: customer?.docNumber ?? "",
      customerName: customer?.name ?? "",
      saleTotal: total,
    },
  });

  const formValues = useWatch({ control });

  const cashAmount = formValues.cashAmount ?? 0;
  const cashTendered = formValues.cashTendered ?? 0;
  const cardAmount = formValues.cardAmount ?? 0;
  const yapePlinAmount = formValues.yapePlinAmount ?? 0;
  const creditAmount = formValues.creditAmount ?? 0;
  const requiresInvoice = Boolean(
    formValues.requiresInvoice || isOverSunatLimit,
  );

  const totalAssigned = Number(
    (cashAmount + cardAmount + yapePlinAmount + creditAmount).toFixed(2),
  );
  const difference = Number((total - totalAssigned).toFixed(2));
  const changeDue = Math.max(0, Number((cashTendered - cashAmount).toFixed(2)));

  const availableCredit = customer?.availableCredit ?? 0;
  const isCreditExceeded = creditAmount > availableCredit;

  useKeyboardShortcuts(
    {
      Escape: () => onOpenChange(false),
    },
    open,
  );

  useEffect(() => {
    if (open) {
      setValue("cashAmount", total);
      setValue("cashTendered", total);
      setValue("cardAmount", 0);
      setValue("cardReference", "");
      setValue("yapePlinAmount", 0);
      setValue("yapeReference", "");
      setValue("creditAmount", 0);
      setValue("saleTotal", total);

      if (isOverSunatLimit) {
        setValue("requiresInvoice", true);
      }

      if (customer) {
        setValue("customerDocNumber", customer.docNumber ?? "");
        setValue("customerName", customer.name);
      }
      setTimeout(() => cashInputRef.current?.focus(), 50);
    }
  }, [open, total, customer, setValue, isOverSunatLimit]);

  const onSubmit = async (values: CheckoutFormValues) => {
    if (difference !== 0 || isCreditExceeded) return;

    const payments: PaymentSplit[] = [];
    if (values.cashAmount > 0) {
      payments.push({ paymentMethod: "CASH", amount: values.cashAmount });
    }
    if (values.cardAmount > 0) {
      payments.push({
        paymentMethod: "CARD",
        amount: values.cardAmount,
        referenceCode: values.cardReference || undefined,
      });
    }
    if (values.yapePlinAmount > 0) {
      payments.push({
        paymentMethod: "YAPE_PLIN",
        amount: values.yapePlinAmount,
        referenceCode: values.yapeReference || undefined,
      });
    }
    if (values.creditAmount > 0) {
      payments.push({ paymentMethod: "CREDIT", amount: values.creditAmount });
    }

    const shouldDispatchFiscal = values.requiresInvoice || isOverSunatLimit;

    const fiscal: FiscalDispatchInfo | null = shouldDispatchFiscal
      ? {
          requiresInvoice: true,
          docType: values.docType,
          customerDocNumber: values.customerDocNumber.trim(),
          customerName: values.customerName.trim(),
        }
      : null;

    await onConfirmSale(payments, fiscal);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border-strong bg-surface p-6 font-mono shadow-modal select-none">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-foreground">
                Cobro y Liquidación de Ticket
              </Dialog.Title>
              <Dialog.Description className="text-xs text-foreground-secondary">
                Distribuye el pago entre los métodos permitidos.
              </Dialog.Description>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase text-foreground-secondary">
                Total a Pagar
              </span>
              <div className="text-2xl font-black text-brand">
                S/ {total.toFixed(2)}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 grid grid-cols-2 gap-6"
          >
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase text-foreground-secondary">
                Distribución de Cobro
              </span>

              <Controller
                name="cashAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    ref={cashInputRef}
                    label="Efectivo en Caja"
                    value={field.value}
                    onChange={(val) => field.onChange(Number(val) || 0)}
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border-subtle bg-surface-subtle p-2">
                <Controller
                  name="cashTendered"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      label="Recibido"
                      value={field.value}
                      onChange={(val) => field.onChange(Number(val) || 0)}
                    />
                  )}
                />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-semibold uppercase text-foreground-secondary">
                    Vuelto a Entregar
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-500">
                    S/ {changeDue.toFixed(2)}
                  </span>
                </div>
              </div>

              <Controller
                name="cardAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label="Tarjeta (POS Físico)"
                    value={field.value}
                    onChange={(val) => field.onChange(Number(val) || 0)}
                  />
                )}
              />

              <Controller
                name="yapePlinAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label="Billetera (Yape / Plin)"
                    value={field.value}
                    onChange={(val) => field.onChange(Number(val) || 0)}
                  />
                )}
              />

              <div className="flex flex-col gap-1">
                <Controller
                  name="creditAmount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      label="Al Fiado (Crédito)"
                      value={field.value}
                      onChange={(val) => field.onChange(Number(val) || 0)}
                      error={
                        creditAmount > 0 && !customer
                          ? "Asigne un cliente con crédito en el ticket"
                          : isCreditExceeded
                            ? "Supera el crédito disponible"
                            : undefined
                      }
                    />
                  )}
                />
                {customer && (
                  <span className="text-[11px] text-foreground-muted">
                    Disponible: S/ {customer.availableCredit.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase text-foreground-secondary">
                  Comprobante y Tributación
                </span>

                {isOverSunatLimit && (
                  <div className="flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-[10px] text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      Monto ≥ S/ 700.00: Emisión obligatoria con DNI o RUC.
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Controller
                    name="requiresInvoice"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="requiresInvoice"
                        disabled={isOverSunatLimit}
                        checked={isOverSunatLimit || field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand disabled:opacity-75 cursor-pointer"
                      />
                    )}
                  />
                  <label
                    htmlFor="requiresInvoice"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Emitir Comprobante Fiscal SUNAT</span>
                    {isOverSunatLimit && (
                      <span
                        title="Obligatorio por normativa SUNAT"
                        className="inline-flex"
                      >
                        <Lock className="h-3 w-3 text-amber-400" />
                      </span>
                    )}
                  </label>
                </div>

                {requiresInvoice && (
                  <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-subtle p-3 text-xs">
                    <div>
                      <Controller
                        name="docType"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full rounded border border-border-strong bg-surface-elevated p-1.5 font-mono text-xs text-foreground cursor-pointer"
                          >
                            <option value="03">Boleta de Venta (03)</option>
                            <option value="01">Factura Electrónica (01)</option>
                          </select>
                        )}
                      />
                    </div>

                    <Controller
                      name="customerDocNumber"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <input
                            {...field}
                            placeholder={
                              formValues.docType === "01"
                                ? "RUC de 11 dígitos..."
                                : isOverSunatLimit
                                  ? "DNI obligatorio (8 dígitos)..."
                                  : "DNI (8 dígitos)..."
                            }
                            className="w-full rounded border border-border-strong bg-surface-elevated p-1.5 font-mono text-xs text-foreground"
                          />
                          {errors.customerDocNumber && (
                            <span className="text-[10px] text-rose-500 mt-0.5 block">
                              {errors.customerDocNumber.message}
                            </span>
                          )}
                        </div>
                      )}
                    />

                    <Controller
                      name="customerName"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <input
                            {...field}
                            placeholder={
                              formValues.docType === "01"
                                ? "Razón Social..."
                                : "Nombre completo del cliente..."
                            }
                            className="w-full rounded border border-border-strong bg-surface-elevated p-1.5 font-mono text-xs text-foreground"
                          />
                          {errors.customerName && (
                            <span className="text-[10px] text-rose-500 mt-0.5 block">
                              {errors.customerName.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                )}

                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground-secondary">Asignado:</span>
                    <span className="font-bold">
                      S/ {totalAssigned.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-foreground-secondary">
                      Diferencia:
                    </span>
                    <span
                      className={`font-bold ${
                        difference === 0
                          ? "text-emerald-500"
                          : difference > 0
                            ? "text-amber-500"
                            : "text-rose-500"
                      }`}
                    >
                      {difference === 0
                        ? "Exacto"
                        : `S/ ${difference.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border-subtle pt-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg border border-border-strong px-4 py-2 text-xs font-semibold text-foreground-secondary hover:bg-surface-elevated"
                >
                  Cancelar (ESC)
                </button>
                <button
                  type="submit"
                  disabled={
                    difference !== 0 || isCreditExceeded || isProcessing
                  }
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-elevation hover:bg-emerald-500 disabled:opacity-40"
                >
                  {isProcessing
                    ? "Emitiendo..."
                    : "Confirmar e Imprimir (ENTER)"}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
