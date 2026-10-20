// src/modules/pos/pages/PosTerminalPage.tsx
import { useState, useRef, useMemo } from "react";
import { useBarcodeScanner } from "@/shared/hooks/useBarcodeScanner";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { useProductScan } from "@/modules/catalog/hooks/useProductScan";
import { useCatalogQuery } from "@/modules/catalog/hooks/useCatalogQuery";
import { CatalogTableSkeleton } from "@/modules/catalog/components/skeletons/CatalogTableSkeleton";
import type {
  CatalogProduct,
  ProductConversion,
} from "@/modules/catalog/models/catalog.types";
import type { CustomerCreditProfile } from "@/modules/customers/models/customer.types";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useCurrentShift } from "@/modules/cash-shifts/hooks/useCashShift";
import { alertClosedCashShift } from "@/modules/cash-shifts/utils/shiftAlerts";
import { OpenShiftModal } from "@/modules/cash-shifts/components/OpenShiftModal";
import { usePosCart } from "../hooks/usePosCart";
import { usePosCheckout } from "../hooks/usePosCheckout";
import { PosTicketCart } from "../components/PosTicketCart";
import { PosCheckoutModal } from "../components/PosCheckoutModal";
import type {
  SaleConfirmationResult,
  PaymentSplit,
  FiscalDispatchInfo,
} from "../models/pos.types";
import { Search, Plus, CheckCircle2, Layers } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";

export function PosTerminalPage() {
  const { session } = useAuth();
  const currentWarehouseId =
    session?.defaultWarehouseId ?? "11111111-cccc-4ccc-8ccc-111111111111";

  // Corrección TS18048: Acceso seguro con optional chaining
  const referenceLabel =
    session?.tenant?.profile === "LUBRICENTER"
      ? "Placa de Vehículo"
      : "Obra / Maestro";

  const { data: currentShift } = useCurrentShift();
  const currentShiftId = currentShift?.id;
  const isShiftOpen = currentShift?.status === "OPEN";

  // Estado del Cliente Seleccionado en el Ticket
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerCreditProfile | null>(null);

  const [referenceValue, setReferenceValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    addItemFromCatalog,
    updateItemQuantity,
    removeItem,
    clearCart,
    cartTotal,
  } = usePosCart();

  const { data: catalogItems = [], isLoading: isCatalogLoading } =
    useCatalogQuery({
      searchTerm,
      warehouseId: currentWarehouseId,
    });

  const { confirmSale, isProcessingSale } = usePosCheckout({
    onSuccess: (res: SaleConfirmationResult) => {
      setStatusMessage(
        `Venta procesada con éxito. Ticket #${res.ticketNumber}`,
      );
      clearCart();
      setReferenceValue("");
      setSelectedCustomer(null);
      setIsCheckoutOpen(false);
    },
    onError: (err: Error) => {
      setStatusMessage(`Error en venta: ${err.message}`);
    },
  });

  const { mutate: scanBarcode } = useProductScan({
    warehouseId: currentWarehouseId,
    onSuccess: (product) => {
      addItemFromCatalog(product);
      setStatusMessage(`Agregado: ${product.name}`);
    },
    onError: (err: Error) => {
      setStatusMessage(`No encontrado: ${err.message}`);
    },
  });

  const filteredCatalog = useMemo(() => {
    if (selectedCategory === "PHYSICAL")
      return catalogItems.filter((i) => !i.isService);
    if (selectedCategory === "SERVICE")
      return catalogItems.filter((i) => i.isService);
    return catalogItems;
  }, [catalogItems, selectedCategory]);

  const handleSelectProduct = (product: CatalogProduct) => {
    addItemFromCatalog({
      ...product,
      matchedConversion: null,
    });
    setStatusMessage(`Agregado: 1 ${product.baseUnit} de ${product.name}`);
    searchInputRef.current?.focus();
  };

  const handleSelectConversion = (
    product: CatalogProduct,
    conversion: ProductConversion,
  ) => {
    if (
      !product.isService &&
      product.stockAvailable < conversion.conversionRate
    ) {
      setStatusMessage(
        `Stock insuficiente: Se requieren ${conversion.conversionRate} ${product.baseUnit} para 1 ${conversion.presentationName}`,
      );
      return;
    }

    addItemFromCatalog({
      ...product,
      baseSalePrice: conversion.salePrice,
      matchedConversion: conversion,
    });
    setStatusMessage(
      `Agregado: 1 ${conversion.presentationName} (${conversion.conversionRate} ${product.baseUnit}) de ${product.name}`,
    );
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      if (/^\d{8,14}$/.test(searchTerm.trim())) {
        scanBarcode(searchTerm.trim());
      } else if (filteredCatalog.length > 0 && filteredCatalog[0]) {
        handleSelectProduct(filteredCatalog[0]);
      }
      setSearchTerm("");
    }
  };

  // Verificación interactiva del turno de caja
  const handleInitiateCheckout = async (): Promise<void> => {
    if (items.length === 0) return;

    if (!isShiftOpen) {
      const wantToOpen = await alertClosedCashShift();
      if (wantToOpen) {
        setIsOpenShiftModalOpen(true);
      }
      return;
    }

    setIsCheckoutOpen(true);
  };

  useKeyboardShortcuts({
    F9: () => {
      void handleInitiateCheckout();
    },
    F2: () => {
      searchInputRef.current?.focus();
    },
  });

  useBarcodeScanner({
    onScan: (code) => {
      scanBarcode(code);
    },
  });

  return (
    <div className="grid h-full grid-cols-12 overflow-hidden bg-canvas font-mono text-foreground">
      <div className="col-span-12 xl:col-span-8 flex flex-col border-r border-border-subtle p-3 sm:p-4 overflow-hidden h-full">
        <div className="mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-500">
              SCANNER USB ACTIVO
            </span>
            <span className="text-foreground-muted hidden sm:inline">
              | Modo HID Plug & Play
            </span>
          </div>
          <span className="text-foreground-secondary text-[11px]">
            F2 Buscar • F9 Cobrar
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="[F2] SKU, Código de barras o Nombre..."
            className="w-full rounded-lg border border-border-strong bg-surface-elevated py-2 pl-9 pr-20 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2 text-[10px] text-foreground-muted hover:text-foreground"
            >
              LIMPIAR
            </button>
          )}
        </div>

        <div className="mb-3 flex gap-1.5 overflow-x-auto text-[11px] pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`rounded px-2.5 py-1 font-bold transition-colors shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-brand text-brand-fg"
                : "border border-border-strong bg-surface text-foreground-secondary hover:bg-surface-elevated"
            }`}
          >
            Todos ({catalogItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("PHYSICAL")}
            className={`rounded px-2.5 py-1 font-bold transition-colors shrink-0 ${
              selectedCategory === "PHYSICAL"
                ? "bg-brand text-brand-fg"
                : "border border-border-strong bg-surface text-foreground-secondary hover:bg-surface-elevated"
            }`}
          >
            Materiales y Bienes Físicos
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("SERVICE")}
            className={`rounded px-2.5 py-1 font-bold transition-colors shrink-0 ${
              selectedCategory === "SERVICE"
                ? "bg-brand text-brand-fg"
                : "border border-border-strong bg-surface text-foreground-secondary hover:bg-surface-elevated"
            }`}
          >
            Servicios e Instalación
          </button>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border-strong bg-surface shadow-elevation">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-border-subtle bg-surface-subtle text-[11px] uppercase text-foreground-secondary z-10">
              <tr>
                <th className="p-2.5">Descripción Técnica / Presentaciones</th>
                <th className="p-2.5 text-center">Tipo</th>
                <th className="p-2.5 text-right">Disponible</th>
                <th className="p-2.5 text-right">Precio Base</th>
                <th className="p-2.5 text-center min-w-[190px]">
                  Despacho Rápido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isCatalogLoading ? (
                <CatalogTableSkeleton rows={6} columnsCount={5} />
              ) : filteredCatalog.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-foreground-muted"
                  >
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              ) : (
                filteredCatalog.map((prod) => (
                  <tr
                    key={prod.productId}
                    className="transition-colors hover:bg-surface-elevated"
                  >
                    <td className="p-2.5">
                      <p className="font-bold text-foreground">{prod.name}</p>
                      <span className="text-[11px] text-foreground-muted">
                        Und. Base: {prod.baseUnit}
                      </span>
                    </td>

                    <td className="p-2.5 text-center">
                      {prod.isService ? (
                        <Badge intent="indigo">Servicio</Badge>
                      ) : (
                        <Badge intent="neutral">Físico</Badge>
                      )}
                    </td>

                    <td className="p-2.5 text-right font-bold">
                      {prod.isService ? (
                        <span className="text-indigo-400">Sin Límite</span>
                      ) : (
                        <span
                          className={
                            prod.stockAvailable <= 10
                              ? "text-rose-500"
                              : "text-emerald-500"
                          }
                        >
                          {prod.stockAvailable.toFixed(2)} {prod.baseUnit}
                        </span>
                      )}
                    </td>

                    <td className="p-2.5 text-right font-black text-amber-500">
                      S/ {prod.baseSalePrice.toFixed(2)}
                    </td>

                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(prod)}
                          className="inline-flex items-center gap-1 rounded bg-brand/10 border border-brand/30 px-2 py-1 text-[11px] font-bold text-brand hover:bg-brand hover:text-brand-fg transition-all active:scale-95"
                          title={`Despachar 1 ${prod.baseUnit} a S/ ${prod.baseSalePrice.toFixed(2)}`}
                        >
                          <Plus className="h-3 w-3" />1 {prod.baseUnit}
                        </button>

                        {prod.conversions?.map((conv) => (
                          <button
                            key={conv.conversionId}
                            type="button"
                            onClick={() => handleSelectConversion(prod, conv)}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[11px] font-bold text-amber-500 hover:bg-amber-500 hover:text-black transition-all active:scale-95"
                            title={`Despachar ${conv.presentationName} (Factor x${conv.conversionRate}) a S/ ${conv.salePrice.toFixed(2)}`}
                          >
                            <Layers className="h-3 w-3" />
                            {conv.presentationName} (S/{" "}
                            {conv.salePrice.toFixed(0)})
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {statusMessage && (
          <div className="mt-3 flex items-center gap-2 rounded border border-border-subtle bg-surface-subtle p-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      <div className="col-span-12 xl:col-span-4 flex flex-col h-full bg-surface-subtle p-3 overflow-hidden border-t xl:border-t-0 border-border-strong">
        <PosTicketCart
          items={items}
          total={cartTotal}
          onUpdateQuantity={updateItemQuantity}
          onRemoveItem={removeItem}
          onCheckout={() => void handleInitiateCheckout()}
          referenceLabel={referenceLabel}
          referenceValue={referenceValue}
          onReferenceChange={setReferenceValue}
          customer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />
      </div>

      {/* Modal de Apertura de Caja si se intenta cobrar estando cerrada */}
      <OpenShiftModal
        open={isOpenShiftModalOpen}
        onOpenChange={setIsOpenShiftModalOpen}
        onSuccess={() => {
          setIsCheckoutOpen(true);
        }}
      />

      {/* Modal de Cobro con Cliente Real Conectado */}
      <PosCheckoutModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        total={cartTotal}
        customer={selectedCustomer}
        onConfirmSale={async (
          payments: PaymentSplit[],
          fiscal: FiscalDispatchInfo | null,
        ) => {
          if (!currentShiftId || !isShiftOpen) {
            setStatusMessage("⚠️ No hay un turno de caja abierto.");
            setIsCheckoutOpen(false);
            setIsOpenShiftModalOpen(true);
            return;
          }

          await confirmSale({
            warehouseId: currentWarehouseId,
            shiftId: currentShiftId,
            customerId: selectedCustomer?.id ?? null,
            referenceValue: referenceValue || null,
            items,
            payments,
            fiscalDispatch: fiscal,
          });
        }}
        isProcessing={isProcessingSale}
      />
    </div>
  );
}
