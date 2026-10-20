// src/modules/fiscal/presentation/components/FiscalMonitorTable.tsx
import type { FiscalDocumentSummary } from "../models/fiscal.types";
import { Badge } from "@/shared/components/ui/Badge";
import {
  RotateCw,
  FileText,
  Code2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface FiscalMonitorTableProps {
  readonly documents: readonly FiscalDocumentSummary[];
  readonly onRetrySingle: (docId: string) => void;
  readonly isRetrying: boolean;
}

export function FiscalMonitorTable({
  documents,
  onRetrySingle,
  isRetrying,
}: FiscalMonitorTableProps) {
  if (documents.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center font-mono text-xs text-foreground-muted">
        <span>No se encontraron comprobantes fiscales registrados.</span>
      </div>
    );
  }

  // URL base de la API para descargas
  const API_BASE = "http://localhost:3000/api/v1";

  return (
    <div className="overflow-x-auto rounded-lg border border-border-strong bg-surface">
      <table className="w-full text-left font-mono text-xs">
        <thead className="border-b border-border-subtle bg-surface-subtle text-foreground-secondary">
          <tr>
            <th className="p-3">Comprobante</th>
            <th className="p-3">Ticket</th>
            <th className="p-3">Fecha</th>
            <th className="p-3 text-right">Total</th>
            <th className="p-3">Estado Outbox</th>
            <th className="p-3">Respuesta CDR</th>
            <th className="p-3 text-center">Archivos</th>
            <th className="p-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {documents.map((doc) => {
            const isFailed =
              doc.outboxStatus === "FAILED" || doc.cdrStatus === "REJECTED";
            const docLabel = doc.docType === "01" ? "Factura" : "Boleta";

            return (
              <tr key={doc.id} className="hover:bg-surface-elevated">
                <td className="p-3 font-bold text-foreground">
                  {docLabel} {doc.series}-{String(doc.number).padStart(8, "0")}
                </td>
                <td className="p-3 text-foreground-secondary">
                  #{doc.ticketNumber}
                </td>
                <td className="p-3 text-foreground-secondary">
                  {new Date(doc.issuedAt).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="p-3 text-right font-bold text-foreground">
                  S/ {doc.total.toFixed(2)}
                </td>
                <td className="p-3">
                  {doc.outboxStatus === "SENT" && (
                    <Badge intent="emerald">Enviado</Badge>
                  )}
                  {doc.outboxStatus === "PROCESSING" && (
                    <Badge intent="amber" indicatorPulse>
                      Procesando
                    </Badge>
                  )}
                  {doc.outboxStatus === "PENDING" && (
                    <Badge intent="neutral">En Cola</Badge>
                  )}
                  {doc.outboxStatus === "FAILED" && (
                    <div className="flex items-center gap-1">
                      <Badge intent="rose">Falló (x{doc.retryCount})</Badge>
                      {doc.lastError && (
                        <span title={doc.lastError}>
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500 cursor-pointer" />
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {doc.cdrStatus === "ACCEPTED" && (
                    <Badge intent="emerald">Aceptado</Badge>
                  )}
                  {doc.cdrStatus === "REJECTED" && (
                    <Badge intent="rose">Rechazado</Badge>
                  )}
                  {doc.cdrStatus === "PENDING" && (
                    <Badge intent="neutral">Pendiente</Badge>
                  )}
                </td>

                {/* Columna ARCHIVOS: descarga directa conectada a la API */}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <a
                      href={`${API_BASE}/fiscal/documents/${doc.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      title="Descargar PDF (Representación Impresa)"
                      className="rounded p-1 text-foreground-secondary hover:bg-surface-elevated hover:text-brand transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                    <a
                      href={`${API_BASE}/fiscal/documents/${doc.id}/xml`}
                      target="_blank"
                      rel="noreferrer"
                      title="Descargar XML Firmado"
                      className="rounded p-1 text-foreground-secondary hover:bg-surface-elevated hover:text-brand transition-colors"
                    >
                      <Code2 className="h-4 w-4" />
                    </a>
                  </div>
                </td>

                {/* Columna ACCIONES: Badge de Completado o botón Reintentar */}
                <td className="p-3 text-center font-mono">
                  {doc.cdrStatus === "ACCEPTED" ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Completado
                    </span>
                  ) : isFailed ? (
                    <button
                      type="button"
                      onClick={() => onRetrySingle(doc.id)}
                      disabled={isRetrying}
                      className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                      title="Reintentar Despacho Fiscal"
                    >
                      <RotateCw className="h-3 w-3" />
                      Reintentar
                    </button>
                  ) : (
                    <span className="text-foreground-muted text-[11px]">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
