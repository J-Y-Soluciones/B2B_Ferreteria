//src/modules/cash-shifts/components/OpenShiftModal.tsx
import { useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { applyRFC7807ToForm } from "@/shared/api/rfc7807";
import {
  blindCloseShiftSchema,
  type BlindCloseShiftInput,
} from "../schemas/cashShift.schemas";

interface BlindCloseShiftModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmitClose: (data: BlindCloseShiftInput) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function BlindCloseShiftModal({
  open,
  onOpenChange,
  onSubmitClose,
  isSubmitting,
}: BlindCloseShiftModalProps) {
  const cashInputRef = useRef<HTMLInputElement>(null);
  const cardsInputRef = useRef<HTMLInputElement>(null);
  const yapeInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<BlindCloseShiftInput>({
    resolver: zodResolver(blindCloseShiftSchema),
    defaultValues: {
      declaredCash: 0,
      declaredCards: 0,
      declaredYapePlin: 0,
      notes: "",
    },
  });

  // Atajos contextuales de la pantalla de arqueo ciego (PRD_DESIGN_SYSTEM.md)
  useKeyboardShortcuts(
    {
      F3: () => cardsInputRef.current?.focus(),
      F4: () => yapeInputRef.current?.focus(),
      F7: () =>
        reset({
          declaredCash: 0,
          declaredCards: 0,
          declaredYapePlin: 0,
          notes: "",
        }),
      F9: () => {
        void handleSubmit(onFormSubmit)();
      },
    },
    open,
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => cashInputRef.current?.focus(), 50);
    }
  }, [open]);

  const onFormSubmit = async (data: BlindCloseShiftInput) => {
    try {
      await onSubmitClose(data);
    } catch (err: unknown) {
      applyRFC7807ToForm(err, setError);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border-strong bg-surface p-6 shadow-modal duration-200">
          <div className="flex flex-col border-b border-border-subtle pb-3">
            <Dialog.Title className="text-lg font-bold text-foreground flex items-center justify-between">
              Declaración Física de Turno (Arqueo Ciego)
            </Dialog.Title>
            <Dialog.Description className="text-xs text-foreground-secondary mt-1">
              Ingresa el dinero físico y vouchers recolectados. Los saldos
              teóricos se conciliarán de forma confidencial.
            </Dialog.Description>
          </div>

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex flex-col gap-4 py-4"
          >
            <Controller
              name="declaredCash"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  ref={cashInputRef}
                  label="Efectivo en Caja (Contado)"
                  value={field.value}
                  onChange={(val) => field.onChange(Number(val) || 0)}
                  error={errors.declaredCash?.message}
                />
              )}
            />

            <Controller
              name="declaredCards"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  ref={cardsInputRef}
                  label="Vouchers Tarjeta (F3)"
                  value={field.value}
                  onChange={(val) => field.onChange(Number(val) || 0)}
                  error={errors.declaredCards?.message}
                />
              )}
            />

            <Controller
              name="declaredYapePlin"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  ref={yapeInputRef}
                  label="Billeteras Digitales Yape / Plin (F4)"
                  value={field.value}
                  onChange={(val) => field.onChange(Number(val) || 0)}
                  error={errors.declaredYapePlin?.message}
                />
              )}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                Observaciones del Arqueo
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Comentarios adicionales o incidencias en el turno..."
                    className="w-full rounded-lg border border-border-strong bg-surface-elevated p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border-strong px-4 py-2 text-xs font-mono font-semibold text-foreground-secondary hover:bg-surface-elevated"
              >
                Cancelar (ESC)
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-brand px-5 py-2 text-xs font-mono font-bold text-brand-fg hover:bg-brand-hover disabled:opacity-50"
              >
                {isSubmitting
                  ? "Cerrando Turno..."
                  : "Declarar y Cerrar Caja (F9)"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
