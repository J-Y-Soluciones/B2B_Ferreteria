export function FiscalTableSkeleton() {
  return (
    <div
      data-testid="fiscal-skeleton"
      className="space-y-2 animate-pulse font-mono"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-12 bg-surface-elevated border border-border-subtle rounded-lg flex items-center justify-between px-4"
        >
          <div className="h-4 bg-surface-subtle rounded w-24" />
          <div className="h-4 bg-surface-subtle rounded w-32" />
          <div className="h-4 bg-surface-subtle rounded w-20" />
          <div className="h-4 bg-surface-subtle rounded w-16" />
        </div>
      ))}
    </div>
  );
}
