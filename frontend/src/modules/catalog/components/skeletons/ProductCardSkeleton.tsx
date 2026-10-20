export function ProductCardSkeleton() {
  return (
    <div
      data-testid="product-card-skeleton"
      className="p-3 bg-surface border border-border-subtle rounded-lg flex items-center justify-between animate-pulse"
    >
      <div className="flex flex-col gap-2 w-2/3">
        <div className="h-4 bg-surface-subtle rounded w-3/4" />
        <div className="h-3 bg-surface-subtle rounded w-1/2" />
      </div>
      <div className="flex flex-col items-end gap-2 w-1/4">
        <div className="h-5 bg-surface-subtle rounded w-16" />
        <div className="h-3 bg-surface-subtle rounded w-10" />
      </div>
    </div>
  );
}
