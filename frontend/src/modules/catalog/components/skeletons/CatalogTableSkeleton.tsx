//src/modules/catalog/components/skeletons/CatalogTableSkeleton.ts

interface CatalogTableSkeletonProps {
  readonly rows?: number;
  readonly columnsCount?: number;
}

export function CatalogTableSkeleton({
  rows = 5,
  columnsCount = 5,
}: CatalogTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={`skel-row-${rIdx}`}
          className="animate-pulse border-b border-border-subtle"
        >
          <td className="p-3">
            <div className="h-4 w-48 rounded bg-surface-elevated" />
            <div className="mt-2 h-3 w-28 rounded bg-surface-elevated/60" />
          </td>
          <td className="p-3 text-center">
            <div className="mx-auto h-5 w-16 rounded bg-surface-elevated" />
          </td>
          <td className="p-3 text-center">
            <div className="mx-auto h-4 w-10 rounded bg-surface-elevated" />
          </td>
          <td className="p-3 text-right">
            <div className="ml-auto h-4 w-14 rounded bg-surface-elevated" />
          </td>
          <td className="p-3 text-right">
            <div className="ml-auto h-4 w-16 rounded bg-surface-elevated" />
          </td>
          {columnsCount >= 6 && (
            <td className="p-3 text-center">
              <div className="mx-auto h-5 w-24 rounded bg-surface-elevated" />
            </td>
          )}
          {columnsCount >= 7 && (
            <td className="p-3 text-center">
              <div className="mx-auto h-5 w-6 rounded bg-surface-elevated" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
