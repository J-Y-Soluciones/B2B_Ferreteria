// src/modules/fiscal/pages/FiscalMonitorPage.tsx
import { useState } from "react";
import { useFiscalDocuments } from "../hooks/useFiscalDocuments";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { alertService } from "@/shared/utils/alerts";
import { httpClient } from "@/shared/api/httpClient";
import type { FiscalDocType, CdrStatus } from "../models/fiscal.types";
import {
  FileText,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";

export function FiscalMonitorPage() {
  const [docTypeFilter, setDocTypeFilter] = useState<FiscalDocType | "ALL">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<CdrStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { documents, isLoading, isRefetching, retryDocument, isRetrying } =
    useFiscalDocuments({
      filters: {
        docType: docTypeFilter,
        cdrStatus: statusFilter,
        searchTerm,
      },
    });

  useKeyboardShortcuts({
    F3: () => {
      setDocTypeFilter((prev) =>
        prev === "ALL" ? "01" : prev === "01" ? "03" : "ALL",
      );
    },
    F4: () => {
      setStatusFilter((prev) => (prev === "REJECTED" ? "ALL" : "REJECTED"));
    },
    F7: () => {
      setSearchTerm("");
      setDocTypeFilter("ALL");
      setStatusFilter("ALL");
    },
  });

  const handleRetry = async (docId: string, fullNumber: string) => {
    try {
      await retryDocument(docId);
      alertService.success(
        "Reintento Encolado",
        `El comprobante ${fullNumber} fue reseteado a PENDING en Outbox.`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al reintentar envío.";
      alertService.error("Fallo de Reintento", msg);
    }
  };

  const handleDownloadFile = async (docId: string, format: "xml" | "pdf") => {
    try {
      // 1. Descarga autenticada a través del cliente HTTP (incluye Bearer y X-Tenant-Id)
      const response = await httpClient.get<Blob>(
        `/fiscal/documents/${docId}/${format}`,
        {
          responseType: "blob",
        },
      );

      // 2. Determinar el tipo MIME y la extensión del archivo
      const mimeType = format === "pdf" ? "application/pdf" : "application/xml";
      const blob = new Blob([response.data], { type: mimeType });

      // 3. Crear una URL en memoria para el Blob
      const blobUrl = window.URL.createObjectURL(blob);

      if (format === "pdf") {
        // Abrir el PDF renderizado en una nueva pestaña
        window.open(blobUrl, "_blank");
      } else {
        // Descargar directamente el archivo XML
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", `comprobante-${docId}.xml`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Liberar memoria luego de 10 segundos
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al descargar el archivo fiscal.";
      alertService.error("Fallo al Descargar", msg);
    }
  };

  return (
    <div className="flex h-full flex-col bg-canvas p-4 font-mono text-xs text-foreground space-y-4 select-none">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-border-strong pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">
              Monitor Fiscal SUNAT (PSE)
            </h1>
            <p className="text-[10px] text-foreground-muted">
              Auditoría de Comprobantes Electrónicos, CDR y Cola Outbox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            PSE Online & Transaccional
          </span>
          {isRefetching && (
            <span className="text-brand flex items-center gap-1 font-bold">
              <RefreshCw className="h-3 w-3 animate-spin" /> Sincronizando...
            </span>
          )}
        </div>
      </div>

      {/* Toolbar y Filtros con estilo idéntico al POS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serie, correlativo..."
              className="h-8 w-56 rounded-lg border border-border-strong bg-surface py-1 pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-inner"
            />
          </div>

          {/* Filtro Tipo Comprobante (F3) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface p-1">
            {(
              [
                { id: "ALL", label: "Todos" },
                { id: "03", label: "Boletas (03)" },
                { id: "01", label: "Facturas (01)" },
              ] as const
            ).map((t) => {
              const isSelected = docTypeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDocTypeFilter(t.id)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? "bg-brand text-brand-fg shadow-sm"
                      : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Filtro CDR Status (F4) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface p-1">
            {(
              [
                { id: "ALL", label: "Estados" },
                { id: "ACCEPTED", label: "Aceptados" },
                { id: "PENDING", label: "Pendientes" },
                { id: "REJECTED", label: "Rechazados" },
              ] as const
            ).map((s) => {
              const isSelected = statusFilter === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? "bg-brand text-brand-fg shadow-sm"
                      : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[11px] text-foreground-secondary">
          F3 Alternar Tipo • F4 Filtrar Rechazados • F7 Reset
        </span>
      </div>

      {/* Tabla de Comprobantes */}
      <div className="flex-1 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-elevation">
        <div className="h-full overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 border-b border-border-strong bg-surface-subtle text-[10px] uppercase text-foreground-secondary tracking-wider">
              <tr>
                <th className="p-3 font-bold">Comprobante</th>
                <th className="p-3 font-bold">Tipo</th>
                <th className="p-3 font-bold text-center">Estado CDR</th>
                <th className="p-3 font-bold">Firma / Hash</th>
                <th className="p-3 font-bold text-center">Emisión</th>
                <th className="p-3 font-bold text-center">Archivos</th>
                <th className="p-3 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-foreground-muted"
                  >
                    Cargando monitor de comprobantes...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-foreground-muted"
                  >
                    No se encontraron comprobantes fiscales registrados.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const fullNumber = `${doc.series}-${String(doc.number).padStart(8, "0")}`;
                  const isAccepted = doc.cdrStatus === "ACCEPTED";
                  const isRejected = doc.cdrStatus === "REJECTED";
                  const isPending = doc.cdrStatus === "PENDING";

                  return (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-surface-elevated"
                    >
                      <td className="p-3 font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-brand" />
                          <span>{fullNumber}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                            doc.docType === "01"
                              ? "border-sky-500/30 bg-sky-500/10 text-sky-500"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {doc.docType === "01"
                            ? "Factura Electrónica"
                            : "Boleta de Venta"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border ${
                            isAccepted
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isRejected
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isAccepted && <CheckCircle2 className="h-3 w-3" />}
                          {isRejected && <AlertTriangle className="h-3 w-3" />}
                          {isPending && (
                            <Clock className="h-3 w-3 animate-spin" />
                          )}
                          <span>{doc.cdrStatus}</span>
                        </span>
                        {doc.sunatErrorMessage && (
                          <p
                            className="mt-1 text-[9px] text-rose-500 max-w-[200px] truncate"
                            title={doc.sunatErrorMessage}
                          >
                            {doc.sunatErrorMessage}
                          </p>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[10px] text-foreground-muted">
                        {doc.hashCpe ? (
                          <span
                            className="truncate max-w-[140px] block"
                            title={doc.hashCpe}
                          >
                            {doc.hashCpe.slice(0, 16)}...
                          </span>
                        ) : (
                          <span className="text-foreground-muted/50">—</span>
                        )}
                      </td>

                      <td className="p-3 text-center text-foreground-muted text-[10px]">
                        {new Date(doc.issuedAt).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(doc.id, "xml")}
                            className="inline-flex items-center gap-1 rounded border border-border-strong bg-surface-elevated px-2 py-1 text-[10px] font-bold text-foreground hover:border-brand hover:text-brand transition-colors"
                            title="Descargar XML firmado"
                          >
                            <span>XML</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(doc.id, "pdf")}
                            className="inline-flex items-center gap-1 rounded border border-border-strong bg-surface-elevated px-2 py-1 text-[10px] font-bold text-foreground hover:border-brand hover:text-brand transition-colors"
                            title="Descargar Representación Impresa (PDF)"
                          >
                            <Download className="h-3 w-3 text-brand" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>

                      {/* Columna Acciones Limpia */}
                      <td className="p-3 text-center font-mono">
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completado</span>
                          </span>
                        ) : isRejected || isPending ? (
                          <button
                            type="button"
                            disabled={isRetrying}
                            onClick={() => void handleRetry(doc.id, fullNumber)}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-bold text-amber-500 hover:bg-amber-500 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                            title="Reintentar Despacho a SUNAT"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Reintentar</span>
                          </button>
                        ) : (
                          <span className="text-foreground-muted text-[11px]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
