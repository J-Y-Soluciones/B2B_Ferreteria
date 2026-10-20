// src/modules/platform/presentation/components/kpi/PlatformMetricsSkeleton.tsx
export function PlatformMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-subtle bg-surface p-4 flex flex-col justify-between h-[106px] animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-surface-elevated rounded" />
            <div className="h-4 w-12 bg-surface-elevated rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="h-7 w-32 bg-surface-elevated rounded" />
            <div className="h-2.5 w-40 bg-surface-elevated rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
