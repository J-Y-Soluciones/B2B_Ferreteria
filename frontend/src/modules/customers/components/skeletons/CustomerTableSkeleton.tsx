interface CustomerTableSkeletonProps {
  readonly rows?: number;
}

export function CustomerTableSkeleton({
  rows = 4,
}: CustomerTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr
          key={`skel-cust-${idx}`}
          className="animate-pulse border-b border-border-subtle"
        >
          <td className="p-3">
            <div className="h-4 w-40 rounded bg-surface-elevated" />
            <div className="mt-2 h-3 w-24 rounded bg-surface-elevated/60" />
          </td>
          <td className="p-3 text-right">
            <div className="ml-auto h-4 w-16 rounded bg-surface-elevated" />
          </td>
          <td className="p-3 text-right">
            <div className="ml-auto h-4 w-16 rounded bg-surface-elevated" />
          </td>
          <td className="p-3 text-right">
            <div className="ml-auto h-4 w-16 rounded bg-surface-elevated" />
          </td>
          <td className="p-3 text-center">
            <div className="mx-auto h-5 w-20 rounded bg-surface-elevated" />
          </td>
        </tr>
      ))}
    </>
  );
}
