import { useFiscalMonitor } from "../hooks/useFiscalMonitor";
import { FiscalMonitorTable } from "../components/FiscalMonitorTable";
import { RotateCw } from "lucide-react";

export function SalesHistoryPage() {
  const {
    documents,
    isLoading,
    retrySingle,
    isRetryingSingle,
    retryAll,
    isRetryingAll,
    refetch,
  } = useFiscalMonitor();

  return (
    <div className="flex h-full flex-col p-6 font-mono">
      <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Historial y Monitor Fiscal SUNAT
          </h1>
          <p className="text-xs text-foreground-secondary">
            Cola asíncrona de comprobantes desacoplados (Facturas y Boletas
            Electrónicas).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-1 rounded border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs text-foreground hover:bg-surface-subtle"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Refrescar</span>
          </button>
          <button
            type="button"
            onClick={() => void retryAll()}
            disabled={isRetryingAll}
            className="rounded bg-brand px-3 py-1.5 text-xs font-bold text-brand-fg hover:bg-brand-hover disabled:opacity-50"
          >
            {isRetryingAll
              ? "Reintentando..."
              : "Reintentar Todos los Fallidos"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-xs text-foreground-muted">
            Sondeando outbox fiscal...
          </div>
        ) : (
          <FiscalMonitorTable
            documents={documents}
            onRetrySingle={(id) => void retrySingle(id)}
            isRetrying={isRetryingSingle}
          />
        )}
      </div>
    </div>
  );
}
