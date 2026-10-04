'use client';

/* ============================================================
   Skeleton loaders — grey shimmer placeholders
   ============================================================ */

export function SkeletonBlock({ h = 12, w = '100%', className = '' }: { h?: number; w?: string | number; className?: string }) {
  return <div className={`ag-skeleton ${className}`} style={{ height: h, width: w }} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="ag-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="ag-skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock h={12} w="60%" />
          <SkeletonBlock h={9} w="40%" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} h={9} w={`${85 - i * 15}%`} />
      ))}
    </div>
  );
}

export function SkeletonStat({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 ${count === 5 ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ag-card p-4 flex items-center gap-4">
          <div className="ag-skeleton w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock h={16} w="50%" />
            <SkeletonBlock h={9} w="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="ag-card p-4 space-y-3">
      <SkeletonBlock h={10} w="30%" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} h={10} w="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ h = 260 }: { h?: number }) {
  return (
    <div className="ag-card p-4 space-y-3">
      <SkeletonBlock h={10} w="25%" />
      <SkeletonBlock h={h} w="100%" />
    </div>
  );
}
