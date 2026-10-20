import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { applyRFC7807ToForm } from "@/shared/api/rfc7807";
import {
  debtPaymentFormSchema,
  type DebtPaymentFormValues,
} from "../schemas/customer.schemas";
import type { CustomerCreditProfile } from "../models/customer.types";
import {
  X,
  Bolt,
  Banknote,
  QrCode,
  CreditCard,
  Sparkles,
  Check,
} from "lucide-react";

interface DebtPaymentModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly customer: CustomerCreditProfile;
  readonly activeShiftId: string;
  readonly onConfirmPayment: (data: DebtPaymentFormValues) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function DebtPaymentModal({
  open,
  onOpenChange,
  customer,
  activeShiftId,
  onConfirmPayment,
  isSubmitting,
}: DebtPaymentModalProps) {
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<DebtPaymentFormValues>({
    resolver: zodResolver(debtPaymentFormSchema),
    defaultValues: {
      shiftId: activeShiftId,
      amount: Math.min(customer.currentDebt, 50),
      paymentMethod: "CASH",
      referenceCode: "",
    },
  });

  const enteredAmount = useWatch({ control, name: "amount" }) || 0;
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const remainingAfterPayment = Math.max(
    0,
    customer.currentDebt - enteredAmount,
  );

  useKeyboardShortcuts(
    {
      Escape: () => onOpenChange(false),
    },
    open,
  );

  const onSubmit = async (values: DebtPaymentFormValues) => {
    try {
      await onConfirmPayment(values);
      onOpenChange(false);
    } catch (err: unknown) {
      applyRFC7807ToForm(err, setError);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border-strong bg-surface font-mono shadow-modal overflow-hidden flex flex-col text-foreground select-none">
          {/* Cabecera Técnica Bimodal */}
          <div className="px-5 py-3.5 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bolt className="h-5 w-5 text-brand" />
              <div>
                <Dialog.Title className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Registrar Abono a Fiados
                </Dialog.Title>
                <span className="text-[10px] text-foreground-muted font-mono">
                  POST /api/v1/customers/{customer.id}/debt-payments
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Franja Resumen del Cliente */}
          <div className="px-5 py-2.5 bg-surface-elevated border-b border-border-subtle flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-foreground font-bold">{customer.name}</span>
              <span className="text-foreground-secondary">
                {" "}
                • Doc: {customer.docNumber ?? "Sin documento"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground-secondary">Deuda Total:</span>
              <span className="text-brand font-bold">
                S/ {customer.currentDebt.toFixed(2)}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-5 flex flex-col gap-4"
          >
            {/* Monto y Botones Rápidos */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                <label className="text-brand font-bold">
                  Monto a Abonar en Caja (S/) *
                </label>
                <span className="text-foreground-muted text-[10px]">
                  Acreditación directa al turno de caja
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xl font-bold text-brand">
                  S/
                </span>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-12 rounded-lg border border-border-strong bg-surface-elevated pl-12 pr-4 text-2xl font-bold text-brand font-mono focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                    />
                  )}
                />
              </div>

              {errors.amount && (
                <span className="text-[10px] text-rose-500">
                  {errors.amount.message}
                </span>
              )}

              {/* Botones de cálculo rápido */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setValue(
                      "amount",
                      Number((customer.currentDebt * 0.5).toFixed(2)),
                    )
                  }
                  className="rounded border border-border-strong bg-surface-elevated px-2.5 py-1 text-[11px] text-foreground-secondary hover:text-foreground hover:bg-surface-subtle transition-colors"
                >
                  50%: S/ {(customer.currentDebt * 0.5).toFixed(2)}
                </button>
                <button
                  type="button"
                  onClick={() => setValue("amount", customer.currentDebt)}
                  className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  Liquidar Todo: S/ {customer.currentDebt.toFixed(2)}
                </button>
              </div>
            </div>

            {/* Medio de Pago Segmentado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase font-bold text-foreground-secondary">
                Medio de Pago
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "CASH")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 font-bold transition-all ${
                    paymentMethod === "CASH"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "border-border-strong bg-surface-elevated text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span>Efectivo (CASH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "YAPE_PLIN")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 font-bold transition-all ${
                    paymentMethod === "YAPE_PLIN"
                      ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "border-border-strong bg-surface-elevated text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>Yape / Plin QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "CARD")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 font-bold transition-all ${
                    paymentMethod === "CARD"
                      ? "border-brand bg-brand/15 text-brand shadow-sm"
                      : "border-border-strong bg-surface-elevated text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>POS Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Voucher / Referencia */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase text-foreground-secondary">
                Nro. Operación / Voucher (Opcional si es efectivo)
              </label>
              <Controller
                name="referenceCode"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Ej: OP-982341 o Ref. Depósito BCP"
                    className="w-full rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                  />
                )}
              />
            </div>

            {/* Simulación FIFO en Tiempo Real */}
            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Desglose de Amortización Automática (FIFO):
                </span>
                <span className="text-foreground-secondary font-mono">
                  Monto: S/ {Number(enteredAmount).toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 text-[11px] pt-1 border-t border-border-subtle">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    <span>
                      Amortización directa a comprobantes más antiguos
                    </span>
                  </span>
                  <span className="font-bold font-mono">
                    S/{" "}
                    {Math.min(customer.currentDebt, enteredAmount).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
                <span className="text-foreground-secondary font-bold uppercase">
                  Nuevo Saldo Deudor Total del Cliente:
                </span>
                <span className="text-brand font-bold font-mono text-sm">
                  S/ {remainingAfterPayment.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border-strong bg-surface-elevated px-4 py-2 text-xs font-bold text-foreground-secondary hover:text-foreground hover:bg-surface-subtle transition-colors"
              >
                [ESC] Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || enteredAmount <= 0}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-brand-fg shadow-elevation hover:bg-brand-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Bolt className="h-4 w-4" />
                <span>
                  {isSubmitting
                    ? "Registrando..."
                    : "Confirmar Abono e Ingresar a Caja [ENTER]"}
                </span>
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
