import { useState, useMemo } from "react";
import { useCustomerSearch } from "../hooks/useCustomerSearch";
import { useCustomerCredit } from "../hooks/useCustomerCredit";
import { CustomerTableSkeleton } from "../components/skeletons/CustomerTableSkeleton";
import { DebtPaymentModal } from "../components/DebtPaymentModal";
import { CustomerConfigModal } from "../components/CustomerConfigModal";
import { customerRepository } from "../repositories/HttpCustomerRepository";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { useCurrentShift } from "@/modules/cash-shifts/hooks/useCashShift";
import { OpenShiftModal } from "@/modules/cash-shifts/components/OpenShiftModal";
import {
  Search,
  Wallet,
  Sliders,
  AlertTriangle,
  Receipt,
  FileDown,
  UserPlus,
  Car,
  Printer,
  Bolt,
  CheckCircle2,
} from "lucide-react";

export function CustomersPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);

  // Turno y Cajero Activo desde TanStack Query (resuelve según usuario/tenant autenticado)
  const { data: currentShift } = useCurrentShift();
  const activeShiftId = currentShift?.id ?? "";

  const cashierName = session?.user?.fullName ?? "Caja Mostrador";
  const tenantName = session?.tenant?.tradeName ?? "Ferretería Don Lucho";

  const { data: customers = [], isLoading: isLoadingList } =
    useCustomerSearch(searchTerm);

  const currentCustomer = useMemo(() => {
    if (!customers || customers.length === 0) return null;
    return (
      customers.find((c) => c.id === selectedCustomerId) ?? customers[0] ?? null
    );
  }, [customers, selectedCustomerId]);

  const { recordPayment, isSubmittingPayment } = useCustomerCredit({
    customerId: currentCustomer?.id,
    onSuccessPayment: () => {
      setIsPaymentModalOpen(false);
    },
  });

  const totalDebt = useMemo(
    () => customers.reduce((acc, c) => acc + c.currentDebt, 0),
    [customers],
  );
  const totalCreditLimit = useMemo(
    () => customers.reduce((acc, c) => acc + c.creditLimit, 0),
    [customers],
  );
  const criticalClientsCount = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.hasOverdueDebt ||
          (c.creditLimit > 0 && c.currentDebt / c.creditLimit >= 0.8),
      ).length,
    [customers],
  );
  const placementPercentage =
    totalCreditLimit > 0
      ? ((totalDebt / totalCreditLimit) * 100).toFixed(1)
      : "0.0";

  useKeyboardShortcuts({
    F9: () => {
      if (currentCustomer && currentCustomer.currentDebt > 0) {
        setIsPaymentModalOpen(true);
      }
    },
    p: (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        window.print();
      }
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      alert("No hay clientes en la lista para exportar.");
      return;
    }
    const headers = [
      "ID",
      "Documento",
      "Nombre_Razon_Social",
      "Telefono",
      "Limite_Credito",
      "Deuda_Actual",
      "Credito_Disponible",
      "Estado_Mora",
    ];
    const rows = customers.map((c) => [
      c.id,
      c.docNumber ?? "SIN_DOC",
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone ?? "",
      c.creditLimit.toFixed(2),
      c.currentDebt.toFixed(2),
      c.availableCredit.toFixed(2),
      c.hasOverdueDebt ? "MORA" : "AL_DIA",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cartera_clientes_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCustomer = async (data: {
    name: string;
    docNumber: string;
    phone?: string | null;
    creditLimit: number;
  }) => {
    setIsCreatingCustomer(true);
    try {
      const created = await customerRepository.createCustomer(data);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedCustomerId(created.id);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      alert(
        "No se pudo registrar el cliente. Verifica que el documento no esté duplicado.",
      );
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. PLANTILLA DE IMPRESIÓN EXCLUSIVA (Solo visible al pulsar Imprimir)     */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-mono text-black p-4 max-w-[80mm] mx-auto text-xs">
        <div className="text-center border-b border-black pb-2 mb-2">
          <h1 className="font-bold text-sm uppercase">{tenantName}</h1>
          <p className="text-[10px]">ESTADO DE CUENTA Y LÍNEA DE CRÉDITO</p>
          <p className="text-[10px] mt-1">
            {new Date().toLocaleString("es-PE")}
          </p>
        </div>

        {currentCustomer ? (
          <>
            <div className="border-b border-black pb-2 mb-2 space-y-0.5">
              <p>
                <strong>CLIENTE:</strong> {currentCustomer.name}
              </p>
              <p>
                <strong>DOC/RUC:</strong> {currentCustomer.docNumber ?? "N/A"}
              </p>
              {currentCustomer.phone && (
                <p>
                  <strong>TEL:</strong> {currentCustomer.phone}
                </p>
              )}
              <p>
                <strong>ATENDIDO POR:</strong> {cashierName}
              </p>
            </div>

            <div className="border-b border-black pb-2 mb-2 space-y-1">
              <div className="flex justify-between">
                <span>LÍNEA ASIGNADA:</span>
                <span>S/ {currentCustomer.creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>TOTAL DEUDA EXIGIBLE:</span>
                <span>S/ {currentCustomer.currentDebt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CRÉDITO DISPONIBLE:</span>
                <span>S/ {currentCustomer.availableCredit.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-b border-black pb-2 mb-2">
              <p className="font-bold uppercase text-[10px] mb-1">
                Comprobantes Pendientes:
              </p>
              {currentCustomer.currentDebt > 0 ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Ticket Fiado Reciente</span>
                    <span className="font-bold">
                      S/ {currentCustomer.currentDebt.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] italic">
                  No registra deudas pendientes.
                </p>
              )}
            </div>

            <div className="text-center pt-2 space-y-1 text-[10px]">
              <p className="font-bold">¡Gracias por su puntualidad!</p>
              <p>Conserve este extracto para el control de sus pagos.</p>
            </div>
          </>
        ) : (
          <p>No hay cliente seleccionado.</p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERFAZ OPERATIVA EN PANTALLA (Se oculta al imprimir con print:hidden) */}
      {/* ========================================================================= */}
      <div className="print:hidden flex h-full flex-col overflow-y-auto bg-canvas p-3 sm:p-4 font-mono text-foreground select-none">
        {/* TOP KPI ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
          <div className="rounded-lg border border-border-strong bg-surface p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
                Total Fiado en Calle
              </span>
              <Wallet className="h-4 w-4 text-brand" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-brand tracking-tight font-mono">
                S/{" "}
                {totalDebt.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="rounded bg-rose-500/10 text-rose-500 px-1.5 py-0.5 border border-rose-500/20 text-[10px] font-bold">
                Cartera Vigente
              </span>
              <span className="text-foreground-muted text-[10px]">
                {customers.length} Cuentas Registradas
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border-strong bg-surface p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
                Línea Total Asignada
              </span>
              <Sliders className="h-4 w-4 text-sky-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-foreground tracking-tight font-mono">
                S/{" "}
                {totalCreditLimit.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="bg-brand h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Number(placementPercentage))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-brand font-bold">
                  {placementPercentage}% colocado
                </span>
                <span className="text-emerald-500 font-mono">
                  S/ {(totalCreditLimit - totalDebt).toFixed(2)} disp.
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border-strong bg-surface p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
                Clientes al Límite / Riesgo
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-foreground tracking-tight font-mono">
                {criticalClientsCount}
              </span>
              <span className="text-foreground-secondary text-xs">
                Titulares
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="rounded bg-rose-500/10 text-rose-500 px-1.5 py-0.5 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Línea &gt; 80% o Mora
              </span>
              <span className="text-foreground-muted text-[10px]">
                Requiere amortización
              </span>
            </div>
          </div>

          <div
            onClick={() => {
              if (currentShift?.status !== "OPEN") {
                setIsOpenShiftModalOpen(true);
              }
            }}
            className={`rounded-lg border bg-surface p-3 flex flex-col justify-between shadow-sm transition-all ${
              currentShift?.status === "OPEN"
                ? "border-border-strong cursor-default"
                : "border-amber-500/40 bg-amber-500/5 cursor-pointer hover:border-amber-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
                Amortización FIFO Activa
              </span>
              <CheckCircle2
                className={`h-4 w-4 ${currentShift?.status === "OPEN" ? "text-emerald-500" : "text-amber-500"}`}
              />
            </div>
            <div className="my-2">
              <div
                className={`text-2xl font-black tracking-tight font-mono truncate ${
                  currentShift?.status === "OPEN"
                    ? "text-emerald-500"
                    : "text-amber-500"
                }`}
              >
                {currentShift?.status === "OPEN" ? "Caja 01" : "Caja Cerrada"}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={
                  currentShift?.status === "OPEN"
                    ? "text-emerald-500"
                    : "text-amber-400 font-bold"
                }
              >
                ●{" "}
                {currentShift?.status === "OPEN"
                  ? "Turno Operativo"
                  : "Clic para Abrir Turno"}
              </span>
              <span className="bg-surface-elevated px-1.5 py-0.5 rounded text-foreground-muted border border-border-subtle truncate max-w-[120px]">
                {cashierName}
              </span>
            </div>
          </div>
        </section>

        {/* SEARCH & CONTROLS TOOLBAR */}
        <section className="rounded-lg border border-border-strong bg-surface p-2.5 mb-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar DNI, RUC, Razón Social o Teléfono... [F2]"
                className="w-full h-8 rounded border border-border-strong bg-surface-elevated pl-9 pr-12 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
              <span className="absolute right-2 top-1.5 rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold text-brand border border-border-subtle">
                F2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded border border-border-strong bg-surface-elevated hover:bg-surface-subtle text-xs font-bold text-foreground-secondary hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5 text-sky-500" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-3 rounded border border-brand/30 bg-brand/10 hover:bg-brand hover:text-brand-fg text-xs font-bold text-brand flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Nuevo Cliente</span>
            </button>
          </div>
        </section>

        {/* MAIN WORKSPACE */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 overflow-hidden">
          {/* TABLA PRINCIPAL (7 cols) */}
          <section className="xl:col-span-7 rounded-xl border border-border-strong bg-surface flex flex-col overflow-hidden shadow-elevation">
            <div className="h-8 px-3 bg-surface-subtle border-b border-border-subtle flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-foreground tracking-wider">
                  Libro Mayor de Cuentas por Cobrar
                </span>
                <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-foreground-muted border border-border-subtle">
                  {customers.length} Registros
                </span>
              </div>
              <div className="text-[10px] text-foreground-muted">
                Ordenar:{" "}
                <strong className="text-foreground">Mayor Saldo Deudor</strong>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-surface-subtle border-b border-border-subtle text-[10px] uppercase text-foreground-secondary tracking-wider z-10">
                  <tr>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Cliente / Titular</th>
                    <th className="px-3 py-2 text-right">Línea</th>
                    <th className="px-3 py-2 text-right">Deuda</th>
                    <th className="px-3 py-2 text-right">Disp.</th>
                    <th className="px-3 py-2 text-center">Uso</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-mono">
                  {isLoadingList ? (
                    <CustomerTableSkeleton rows={5} />
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-foreground-muted"
                      >
                        No se encontraron clientes registrados o con crédito.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => {
                      const isSelected = currentCustomer?.id === c.id;
                      const usageRatio =
                        c.creditLimit > 0
                          ? (c.currentDebt / c.creditLimit) * 100
                          : 0;
                      const isOverdue = c.hasOverdueDebt;

                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                          className={`h-11 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-brand/10"
                              : "hover:bg-surface-elevated"
                          }`}
                        >
                          <td
                            className={`px-3 py-1.5 whitespace-nowrap transition-all ${
                              isSelected
                                ? "border-l-4 border-l-brand"
                                : "border-l-4 border-l-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-surface-elevated text-brand font-bold px-1.5 py-0.5 text-[10px] border border-border-subtle">
                                {c.docNumber && c.docNumber.length === 11
                                  ? "RUC"
                                  : "DNI"}
                              </span>
                              <span className="font-bold text-foreground text-xs">
                                {c.docNumber ?? "SIN DOC"}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-1.5">
                            <div
                              className={`font-bold truncate max-w-[180px] ${
                                isSelected ? "text-brand" : "text-foreground"
                              }`}
                            >
                              {c.name}
                            </div>
                            {c.phone && (
                              <div className="text-[10px] text-foreground-muted flex items-center gap-1">
                                <Car className="h-3 w-3 text-brand shrink-0" />
                                <span>{c.phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-1.5 text-right text-foreground-secondary">
                            S/ {c.creditLimit.toFixed(2)}
                          </td>

                          <td className="px-3 py-1.5 text-right font-bold text-brand">
                            S/ {c.currentDebt.toFixed(2)}
                          </td>

                          <td className="px-3 py-1.5 text-right font-bold text-emerald-500">
                            S/ {c.availableCredit.toFixed(2)}
                          </td>

                          <td className="px-3 py-1.5 text-center w-24">
                            <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden border border-border-subtle">
                              <div
                                className={`h-full rounded-full ${
                                  usageRatio >= 90
                                    ? "bg-rose-500"
                                    : usageRatio >= 70
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, usageRatio)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-foreground-muted mt-0.5 block">
                              {usageRatio.toFixed(1)}%
                            </span>
                          </td>

                          <td className="px-3 py-1.5 text-center whitespace-nowrap">
                            {isOverdue ? (
                              <span className="rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold">
                                MORA / CRÍTICO
                              </span>
                            ) : usageRatio >= 80 ? (
                              <span className="rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold">
                                ALERTA {usageRatio.toFixed(0)}%
                              </span>
                            ) : c.currentDebt === 0 ? (
                              <span className="rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold">
                                SIN DEUDA
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold">
                                ACTIVO
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!activeShiftId) {
                                  setIsOpenShiftModalOpen(true);
                                  return;
                                }
                                setSelectedCustomerId(c.id);
                                setIsPaymentModalOpen(true);
                              }}
                              disabled={c.currentDebt <= 0}
                              className="rounded bg-brand hover:bg-brand-hover text-brand-fg font-bold px-2.5 py-1 text-[11px] shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Abonar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PANEL DETALLE DERECHO: ESTADO DE CUENTA FIFO (5 cols) */}
          <section className="xl:col-span-5 rounded-xl border border-border-strong bg-surface flex flex-col justify-between overflow-hidden shadow-elevation">
            {currentCustomer ? (
              <>
                <div className="p-3.5 bg-surface-subtle border-b border-border-subtle flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-brand font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="h-4 w-4" />
                      Estado de Cuenta y Fiados (Detalle FIFO)
                    </span>
                    <span className="rounded bg-surface-elevated text-foreground-secondary border border-border-subtle px-2 py-0.5 text-[10px]">
                      Línea: S/ {currentCustomer.creditLimit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <h2 className="text-base font-bold text-foreground">
                        {currentCustomer.name}
                      </h2>
                      <div className="text-[11px] text-foreground-secondary flex items-center gap-2 mt-0.5">
                        <span>
                          Doc:{" "}
                          <strong className="text-foreground">
                            {currentCustomer.docNumber ?? "N/A"}
                          </strong>
                        </span>
                        {currentCustomer.phone && (
                          <span>
                            • Tel:{" "}
                            <strong className="text-brand">
                              {currentCustomer.phone}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-brand font-mono">
                        S/ {currentCustomer.currentDebt.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold text-rose-500">
                        Utilización:{" "}
                        {currentCustomer.creditLimit > 0
                          ? `${((currentCustomer.currentDebt / currentCustomer.creditLimit) * 100).toFixed(1)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden mt-1 border border-border-subtle">
                    <div
                      className="bg-brand h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          currentCustomer.creditLimit > 0
                            ? (currentCustomer.currentDebt /
                                currentCustomer.creditLimit) *
                                100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Banner FIFO con Cajero y Turno Limpio */}
                <div className="px-3.5 py-1.5 bg-surface-elevated border-b border-border-subtle flex items-center justify-between text-[10px] text-emerald-500 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Caja 01 • Atendido por: {cashierName}</span>
                  </span>
                  <span className="text-foreground-muted font-normal">
                    Amortización FIFO Activa
                  </span>
                </div>

                {/* Comprobantes Pendientes */}
                <div className="p-3.5 flex flex-col gap-2 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between text-[10px] text-foreground-secondary font-bold uppercase tracking-wider">
                    <span>Comprobantes con Saldo Pendiente</span>
                    <span>Orden: Antiguo → Reciente</span>
                  </div>

                  {currentCustomer.currentDebt > 0 ? (
                    <div className="space-y-2">
                      <div className="rounded border border-border-strong bg-surface-elevated p-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-surface px-1.5 py-0.5 font-bold text-foreground border border-border-subtle">
                              #TK-10342
                            </span>
                            <span className="text-foreground-secondary">
                              {new Date().toLocaleDateString("es-PE")}
                            </span>
                            {currentCustomer.hasOverdueDebt && (
                              <span className="rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1 py-0.2 text-[9px] font-bold">
                                VENCIDO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-foreground-muted">
                            Mostrador POS
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground-secondary">
                            Monto Emitido: S/{" "}
                            {currentCustomer.currentDebt.toFixed(2)}
                          </span>
                          <span className="text-emerald-500 font-mono">
                            Amortizado: S/ 0.00
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 bg-surface-subtle px-2 py-1 rounded border border-border-subtle">
                          <span className="text-[10px] text-foreground font-bold uppercase">
                            Saldo Exigible:
                          </span>
                          <span className="text-sm font-bold text-rose-500 font-mono">
                            S/ {currentCustomer.currentDebt.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-border-strong p-6 text-center text-xs text-foreground-muted">
                      Este cliente no registra facturas ni tickets pendientes de
                      pago.
                    </div>
                  )}
                </div>

                {/* Footer Fijo */}
                <div className="p-3.5 bg-surface-subtle border-t border-border-subtle flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground-secondary font-bold uppercase text-[10px]">
                      Total Saldo Deudor Exigible:
                    </span>
                    <span className="text-base font-black text-brand font-mono">
                      S/ {currentCustomer.currentDebt.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="h-9 rounded border border-border-strong bg-surface-elevated hover:bg-surface text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5 text-foreground-muted" />
                      <span>Imprimir [Ctrl + P]</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentCustomer.currentDebt <= 0}
                      onClick={() => {
                        if (!activeShiftId) {
                          setIsOpenShiftModalOpen(true);
                          return;
                        }
                        setIsPaymentModalOpen(true);
                      }}
                      className="h-9 rounded bg-brand hover:bg-brand-hover text-brand-fg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Bolt className="h-4 w-4" />
                      <span>Registrar Abono [F9]</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
                Selecciona un cliente para visualizar su libro mayor.
              </div>
            )}
          </section>
        </div>

        {/* Modales */}
        {currentCustomer && activeShiftId && (
          <DebtPaymentModal
            key={activeShiftId} // <-- Clave reactiva: si cambia el turno, reinicia el formulario
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            customer={currentCustomer}
            activeShiftId={activeShiftId}
            onConfirmPayment={async (data) => {
              await recordPayment({
                customerId: currentCustomer.id,
                shiftId: data.shiftId || activeShiftId,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                referenceCode: data.referenceCode,
              });
            }}
            isSubmitting={isSubmittingPayment}
          />
        )}

        <CustomerConfigModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateCustomer}
          isSubmitting={isCreatingCustomer}
        />
        <OpenShiftModal
          open={isOpenShiftModalOpen}
          onOpenChange={setIsOpenShiftModalOpen}
        />
      </div>
    </>
  );
}
