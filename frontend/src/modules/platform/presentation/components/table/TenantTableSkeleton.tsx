// src/modules/platform/presentation/components/table/TenantTableSkeleton.tsx
export function TenantTableSkeleton({ rows = 4 }: { readonly rows?: number }) {
  return (
    <div className="rounded-xl border border-border-strong bg-surface overflow-hidden shadow-elevation">
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3 w-1/4">
              <div className="h-8 w-8 rounded-lg bg-surface-elevated shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-36 bg-surface-elevated rounded" />
                <div className="h-2.5 w-24 bg-surface-elevated rounded" />
              </div>
            </div>
            <div className="h-5 w-24 bg-surface-elevated rounded" />
            <div className="h-5 w-20 bg-surface-elevated rounded" />
            <div className="h-4 w-24 bg-surface-elevated rounded" />
            <div className="flex gap-1.5">
              <div className="h-4 w-14 bg-surface-elevated rounded" />
              <div className="h-4 w-14 bg-surface-elevated rounded" />
            </div>
            <div className="h-4 w-16 bg-surface-elevated rounded" />
            <div className="h-5 w-20 bg-surface-elevated rounded" />
            <div className="h-7 w-24 bg-surface-elevated rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
