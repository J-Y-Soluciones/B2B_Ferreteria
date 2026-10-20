import { useState } from "react";
import type { CartItem } from "../models/pos.types";
import type { CustomerCreditProfile } from "@/modules/customers/models/customer.types";
import { useCustomerSearch } from "@/modules/customers/hooks/useCustomerSearch";
import { useCurrentShift } from "@/modules/cash-shifts/hooks/useCashShift";
import { alertClosedCashShift } from "@/modules/cash-shifts/utils/shiftAlerts";
import { OpenShiftModal } from "@/modules/cash-shifts/components/OpenShiftModal";
import { Badge } from "@/shared/components/ui/Badge";
import { Trash2, Layers, User, X, Search, Lock } from "lucide-react";

interface PosTicketCartProps {
  readonly items: readonly CartItem[];
  readonly total: number;
  readonly onUpdateQuantity: (id: string, qty: number) => void;
  readonly onRemoveItem: (id: string) => void;
  readonly onCheckout: () => void;
  readonly referenceLabel: string; // "Obra / Maestro" o "Placa de Vehículo"
  readonly referenceValue: string;
  readonly onReferenceChange: (val: string) => void;
  readonly customer: CustomerCreditProfile | null;
  readonly onSelectCustomer: (cust: CustomerCreditProfile | null) => void;
  readonly onSelectConversion?: (
    itemId: string,
    conversionId: string | null,
  ) => void;
}

export function PosTicketCart({
  items,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  referenceLabel,
  referenceValue,
  onReferenceChange,
  customer,
  onSelectCustomer,
}: PosTicketCartProps) {
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);

  // Hook que consulta el turno de caja actual de la terminal
  const { data: currentShift, isLoading: isCheckingShift } = useCurrentShift();
  const isShiftOpen = currentShift?.status === "OPEN";

  const { data: searchedCustomers = [], isLoading: isSearching } =
    useCustomerSearch(customerQuery);

  // Desglose tributario según normativa SUNAT (IGV 18% extraído del total)
  const taxableAmount = total > 0 ? total / 1.18 : 0;
  const igvAmount = total - taxableAmount;

  // Manejo del cobro con validación estricta de turno de caja
  const handleCheckoutClick = async (): Promise<void> => {
    if (items.length === 0) return;

    if (!isShiftOpen) {
      const wantToOpen = await alertClosedCashShift();
      if (wantToOpen) {
        setIsOpenShiftModalOpen(true);
      }
      return;
    }

    onCheckout();
  };

  return (
    <>
      <section className="flex h-full flex-col justify-between border-l border-border-strong bg-surface font-mono select-none">
        {/* Cabecera de Referencia y Asignación de Cliente */}
        <div className="border-b border-border-subtle p-3 bg-surface-subtle space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">
              {referenceLabel} (F4)
            </label>
            <span className="text-[10px] text-foreground-muted">
              {items.length} {items.length === 1 ? "ítem" : "ítems"} en ticket
            </span>
          </div>

          {/* Input de texto para la Referencia (Obra / Placa) */}
          <input
            type="text"
            value={referenceValue}
            onChange={(e) => onReferenceChange(e.target.value)}
            placeholder={`Ingresar ${referenceLabel}...`}
            className="w-full rounded-md border border-border-strong bg-surface-elevated px-2.5 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand shadow-inner"
          />

          {/* Selector de Cliente con Línea de Crédito */}
          <div className="relative">
            {customer ? (
              <div className="flex items-center justify-between rounded border border-brand/40 bg-brand/10 px-2 py-1.5 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="h-3.5 w-3.5 text-brand shrink-0" />
                  <span className="font-bold text-foreground truncate">
                    {customer.name}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-mono font-bold shrink-0">
                    (Disp: S/ {customer.availableCredit.toFixed(2)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCustomer(null)}
                  className="p-0.5 text-foreground-muted hover:text-rose-500 transition-colors shrink-0"
                  title="Quitar cliente asignado"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : isSearchingCustomer ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-foreground-muted" />
                <input
                  type="text"
                  autoFocus
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Buscar cliente por DNI/RUC o Nombre..."
                  className="w-full rounded border border-brand bg-surface-elevated pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchingCustomer(false);
                    setCustomerQuery("");
                  }}
                  className="absolute right-2 top-1.5 text-foreground-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Resultados flotantes */}
                <div className="absolute left-0 top-8 z-50 w-full max-h-48 overflow-y-auto rounded-lg border border-border-strong bg-surface shadow-modal divide-y divide-border-subtle text-xs">
                  {isSearching ? (
                    <div className="p-2 text-center text-[10px] text-foreground-muted">
                      Buscando...
                    </div>
                  ) : searchedCustomers.length === 0 ? (
                    <div className="p-2 text-center text-[10px] text-foreground-muted">
                      No se encontraron clientes
                    </div>
                  ) : (
                    searchedCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCustomer(c);
                          setIsSearchingCustomer(false);
                          setCustomerQuery("");
                        }}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-surface-elevated flex items-center justify-between transition-colors"
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-foreground truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-foreground-secondary">
                            {c.docNumber ?? "Sin Doc"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-emerald-500 font-mono">
                            Disp: S/ {c.availableCredit.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchingCustomer(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded border border-dashed border-border-strong bg-surface-elevated py-1 text-[11px] font-bold text-foreground-secondary hover:text-brand hover:border-brand transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>+ Asignar Cliente Titular (Fiados / Factura)</span>
              </button>
            )}
          </div>
        </div>

        {/* Listado de Líneas del Ticket */}
        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-xs text-foreground-muted gap-1">
              <span className="font-bold text-foreground-secondary">
                Ticket Vacío
              </span>
              <span className="text-[11px]">
                Escanea o selecciona productos del catálogo (F2)
              </span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase text-foreground-secondary tracking-wider">
                  <th className="pb-2 w-14 text-center">Cant</th>
                  <th className="pb-2 pl-2">Ítem / Despacho</th>
                  <th className="pb-2 text-right w-16">P.Unit</th>
                  <th className="pb-2 text-right w-16">Subtotal</th>
                  <th className="pb-2 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((it) => {
                  const allowsDecimals =
                    !it.conversionId &&
                    !it.isService &&
                    ["MTR", "KGM", "KG", "LTR", "GLI"].includes(
                      it.baseUnit?.toUpperCase() ?? "",
                    );

                  return (
                    <tr
                      key={it.id}
                      className="hover:bg-surface-elevated transition-colors"
                    >
                      <td className="py-2.5 align-top text-center">
                        <input
                          type="number"
                          step={allowsDecimals ? "0.1" : "1"}
                          min={allowsDecimals ? "0.01" : "1"}
                          value={it.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val <= 0) return;

                            const finalQty = allowsDecimals
                              ? Number(val.toFixed(2))
                              : Math.max(1, Math.round(val));

                            onUpdateQuantity(it.id, finalQty);
                          }}
                          className="w-14 rounded border border-border-strong bg-surface-elevated py-1 text-center font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-brand shadow-inner text-xs"
                        />
                      </td>

                      <td className="py-2.5 pl-2 pr-1 align-top">
                        <div className="font-bold text-foreground leading-tight line-clamp-2">
                          {it.name}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-foreground-secondary">
                            {it.conversionId ? (
                              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                                <Layers className="h-3 w-3" />
                                {it.presentationName}
                              </span>
                            ) : (
                              <span>Und. Base: {it.baseUnit}</span>
                            )}
                          </span>

                          {it.isService && (
                            <Badge intent="indigo">Servicio</Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 text-right font-medium text-foreground align-top">
                        S/ {it.unitPrice.toFixed(2)}
                      </td>

                      <td className="py-2.5 text-right font-bold text-amber-500 align-top">
                        S/ {it.subtotal.toFixed(2)}
                      </td>

                      <td className="py-2.5 text-center align-top">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(it.id)}
                          className="rounded p-1 text-foreground-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          title="Quitar ítem"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie: Desglose y Botón de Cobro */}
        <div className="border-t border-border-strong bg-surface-elevated p-3.5">
          <div className="mb-3 space-y-1 border-b border-border-subtle pb-2 text-xs">
            <div className="flex justify-between text-foreground-secondary">
              <span>Op. Gravada:</span>
              <span className="font-bold text-foreground">
                S/ {taxableAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>I.G.V. (18%):</span>
              <span className="font-bold text-foreground">
                S/ {igvAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs uppercase font-bold text-foreground-secondary tracking-wider">
              Total a Pagar
            </span>
            <span className="text-2xl font-black text-emerald-500">
              S/ {total.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleCheckoutClick()}
            disabled={items.length === 0 || isCheckingShift}
            className={`w-full rounded-lg py-3 text-sm font-bold shadow-elevation transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
              !isShiftOpen
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {!isShiftOpen && <Lock className="h-4 w-4" />}
            <span>
              {!isShiftOpen
                ? "Caja Cerrada - Abrir Turno (F8)"
                : "Cobrar Ticket (F9)"}
            </span>
          </button>
        </div>
      </section>

      {/* Modal de apertura de caja integrado */}
      <OpenShiftModal
        open={isOpenShiftModalOpen}
        onOpenChange={setIsOpenShiftModalOpen}
        onSuccess={() => {
          // Al abrir la caja con éxito, pasa directamente al checkout
          onCheckout();
        }}
      />
    </>
  );
}
