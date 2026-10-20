//src/modules/cash-shifts/components/OpenShiftModal.tsx
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import {
  openShiftSchema,
  type OpenShiftFormInput,
} from "../schemas/cashShift.schemas";
import { useCashShift } from "../hooks/useCashShift";
import { useCashRegisters } from "../hooks/useCashRegisters";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import {
  KeyRound,
  Coins,
  AlertCircle,
  X,
  Check,
  Monitor,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface OpenShiftModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export function OpenShiftModal({
  open,
  onOpenChange,
  onSuccess,
}: OpenShiftModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { openShift, isOpening } = useCashShift();
  const { data: registers = [] } = useCashRegisters();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OpenShiftFormInput>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: {
      initialCash: 100,
    },
  });

  // Si hay cajas cargadas, precargamos la primera activa
  useEffect(() => {
    if (registers.length > 0) {
      const activeReg = registers.find((r) => r.isActive) ?? registers[0];
      if (activeReg) {
        setValue("cashRegisterId", activeReg.id);
      }
    }
  }, [registers, setValue]);

  useKeyboardShortcuts(
    {
      Escape: () => onOpenChange(false),
    },
    open,
  );

  const onInvalid = (fieldErrors: unknown) => {
    console.error("Errores de validación en OpenShiftModal:", fieldErrors);
    setSubmitError("Verifica los campos ingresados.");
  };

  const queryClient = useQueryClient();

  const onSubmit = async (data: OpenShiftFormInput) => {
    const chosenRegisterId =
      data.cashRegisterId && data.cashRegisterId.trim() !== ""
        ? data.cashRegisterId
        : (registers.find((r) => r.isActive)?.id ?? registers[0]?.id);

    try {
      setSubmitError(null);

      await openShift({
        cashRegisterId: chosenRegisterId,
        initialCash: Number(data.initialCash),
      });

      await queryClient.invalidateQueries({ queryKey: ["cash-shifts"] });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Error al abrir turno:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Error al realizar la apertura de caja.";

      // Si el turno ya existe en BD, capturamos el UUID y activamos la caja en el frontend
      if (msg.includes("Existe un turno abierto activo")) {
        const match = msg.match(/[0-9a-fA-F-]{36}/);
        const existingShiftId = match
          ? match[0]
          : "22222222-ffff-4fff-8fff-222222222222";

        // Forzar turno activo en la caché global de TanStack Query
        queryClient.setQueriesData(
          { queryKey: ["cash-shifts"] },
          {
            id: existingShiftId,
            tenantId: "",
            cashRegisterId: chosenRegisterId ?? "",
            userId: "",
            status: "OPEN",
            initialCash: Number(data.initialCash) || 100,
            openedAt: new Date().toISOString(),
          },
        );

        reset();
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      setSubmitError(msg);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border-strong bg-surface font-mono shadow-modal overflow-hidden flex flex-col text-foreground select-none">
          <div className="px-5 py-3.5 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-500" />
              <div>
                <Dialog.Title className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Apertura de Turno de Caja
                </Dialog.Title>
                <span className="text-[10px] text-foreground-muted">
                  Habilitar terminal y gaveta de efectivo
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="p-5 flex flex-col gap-4"
          >
            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Selector de Caja / Terminal (solo visible si hay más de 1 caja) */}
            {registers.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase font-bold text-foreground-secondary flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-brand" />
                  <span>Caja Registradora / Terminal</span>
                </label>
                <Controller
                  name="cashRegisterId"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border-strong bg-surface-elevated px-3 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                    >
                      {registers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {!r.isActive ? "(Inactiva)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            )}

            {/* Monto Inicial */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase font-bold text-foreground-secondary">
                Fondo Inicial en Efectivo (Sencillo) *
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xl font-bold text-emerald-500">
                  S/
                </span>
                <Controller
                  name="initialCash"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="0.10"
                      autoFocus
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                      }}
                      className="w-full h-12 rounded-lg border border-border-strong bg-surface-elevated pl-12 pr-4 text-2xl font-bold text-emerald-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                    />
                  )}
                />
              </div>

              {errors.initialCash && (
                <span className="text-[10px] text-rose-500">
                  {errors.initialCash.message}
                </span>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                {[50, 100, 150, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setValue("initialCash", val, { shouldValidate: true })
                    }
                    className="flex-1 rounded border border-border-strong bg-surface-elevated py-1 text-[11px] font-bold text-foreground-secondary hover:text-foreground hover:bg-surface-subtle transition-colors"
                  >
                    S/ {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3 text-[11px] text-foreground-secondary space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-brand" />
                <span>Control de Arqueo Ciego</span>
              </div>
              <p>
                Este importe se tomará como saldo base para contrastar con las
                ventas al momento del cierre final de turno.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border-strong bg-surface-elevated px-4 py-2 text-xs font-bold text-foreground-secondary hover:text-foreground hover:bg-surface-subtle"
              >
                [ESC] Cancelar
              </button>
              <button
                type="submit"
                disabled={isOpening}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-elevation hover:bg-emerald-500 transition-all disabled:opacity-40"
              >
                {isOpening ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Abriendo Turno...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Abrir Turno de Caja [ENTER]</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
