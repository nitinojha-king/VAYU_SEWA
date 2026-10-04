'use client';

import { Search, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Fragment } from 'react';

/* ============================================================
   Table toolkit — search, filter pills, sortable header,
   pagination. Used by every data table in the app.
   ============================================================ */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = 'w-64',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-shadow"
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}

export interface FilterPillDef<T extends string> {
  key: T;
  label: string;
}

export function FilterPills<T extends string>({
  pills,
  active,
  onToggle,
  onClear,
}: {
  pills: FilterPillDef<T>[];
  active: Set<T>;
  onToggle: (k: T) => void;
  onClear?: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {pills.map((p) => {
        const on = active.has(p.key);
        return (
          <button
            key={p.key}
            onClick={() => onToggle(p.key)}
            className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
              on
                ? 'bg-navy text-white border-navy shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-navy/40 hover:text-navy'
            }`}
          >
            {p.label}
          </button>
        );
      })}
      {active.size > 0 && onClear ? (
        <button onClick={onClear} className="text-xs text-navy underline underline-offset-2 hover:text-navy-hover ml-1">
          Clear All
        </button>
      ) : null}
    </div>
  );
}

export function SortableTh<K extends string>({
  label,
  colKey,
  sort,
  onSort,
  className = '',
}: {
  label: string;
  colKey: K;
  sort: { key: K; dir: 'asc' | 'desc' } | null;
  onSort: (k: K) => void;
  className?: string;
}) {
  const active = sort?.key === colKey;
  return (
    <th className={`px-3 py-2.5 text-left ${className}`}>
      <button
        onClick={() => onSort(colKey)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
          active ? 'text-navy' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {label}
        {active ? (
          sort?.dir === 'asc' ? (
            <ArrowUp size={11} />
          ) : (
            <ArrowDown size={11} />
          )
        ) : (
          <span className="inline-flex flex-col leading-[5px] opacity-30">
            <ArrowUp size={9} />
            <ArrowDown size={9} />
          </span>
        )}
      </button>
    </th>
  );
}

export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  return rows.slice(page * pageSize, (page + 1) * pageSize);
}

export function Pagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) {
    return <p className="text-xs text-slate-400">Showing {total} result{total === 1 ? '' : 's'}</p>;
  }
  const start = page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-400">
        Showing {start}-{end} of {total} results
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-navy/40 hover:text-navy transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }).map((_, i) => (
          <Fragment key={i}>
            {pages <= 7 || i === 0 || i === pages - 1 || Math.abs(i - page) <= 1 ? (
              <button
                onClick={() => onPage(i)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  i === page ? 'bg-navy text-white' : 'text-slate-500 hover:bg-cloud'
                }`}
              >
                {i + 1}
              </button>
            ) : i === 1 || i === pages - 2 ? (
              <span className="text-slate-300 text-xs px-0.5">…</span>
            ) : null}
          </Fragment>
        ))}
        <button
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-navy/40 hover:text-navy transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
