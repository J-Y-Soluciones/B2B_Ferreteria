import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X, UserPlus, Save } from "lucide-react";
import type { CreateCustomerPayload } from "../repositories/HttpCustomerRepository";

const customerSchema = z.object({
  name: z.string().min(2, "Razón Social o Nombre obligatorio").max(255),
  docNumber: z
    .string()
    .min(8, "Mínimo 8 dígitos (DNI)")
    .max(11, "Máximo 11 dígitos (RUC)")
    .regex(/^\d+$/, "Solo números"),
  phone: z.string().max(20).optional().default(""),
  creditLimit: z.coerce
    .number()
    .min(0, "El límite debe ser mayor o igual a 0")
    .default(1000),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerConfigModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSave: (data: CreateCustomerPayload) => Promise<void>;
  readonly isSubmitting: boolean;
}

export function CustomerConfigModal({
  open,
  onClose,
  onSave,
  isSubmitting,
}: CustomerConfigModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: "",
      docNumber: "",
      phone: "",
      creditLimit: 1000,
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    await onSave(values);
    reset();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border-strong bg-surface p-5 font-mono shadow-modal text-foreground select-none">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand" />
              <Dialog.Title className="text-sm font-bold uppercase tracking-wider">
                Nuevo Cliente y Línea de Fiado
              </Dialog.Title>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 space-y-4 text-xs"
          >
            <div>
              <label className="text-[11px] uppercase text-foreground-secondary font-bold">
                Razón Social / Nombre Completo *
              </label>
              <input
                {...register("name")}
                placeholder="Ej: Constructora Ramos S.A.C. o Juan Pérez"
                className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
              {errors.name && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase text-foreground-secondary font-bold">
                  N° Documento (DNI / RUC) *
                </label>
                <input
                  {...register("docNumber")}
                  placeholder="20608912341"
                  className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
                {errors.docNumber && (
                  <span className="text-[10px] text-rose-500 mt-0.5 block">
                    {errors.docNumber.message}
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase text-foreground-secondary font-bold">
                  Teléfono / Placa Habitual
                </label>
                <input
                  {...register("phone")}
                  placeholder="987654321 / B8Y-901"
                  className="mt-1 w-full rounded border border-border-strong bg-surface-elevated px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3 space-y-1">
              <label className="text-[11px] uppercase text-brand font-bold">
                Límite de Crédito Asignado (S/) *
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-sm font-bold text-brand">
                  S/
                </span>
                <input
                  type="number"
                  step="50"
                  {...register("creditLimit")}
                  className="w-full rounded border border-border-strong bg-surface-elevated pl-9 pr-3 py-1.5 text-base font-bold text-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
              <span className="text-[10px] text-foreground-muted block pt-1">
                Monto máximo que el cliente puede acumular al fiado en compras
                de mostrador.
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-foreground-muted hover:text-foreground"
              >
                [ESC] Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-brand-fg shadow hover:bg-brand-hover disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {isSubmitting ? "Guardando..." : "Crear Cliente [ENTER]"}
                </span>
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
