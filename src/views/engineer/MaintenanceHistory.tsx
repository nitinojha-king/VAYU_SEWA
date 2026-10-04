'use client';

import { useMemo, useState } from 'react';
import { History, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Tooltip';
import { SearchInput, FilterPills, Pagination, paginate } from '@/components/shared/TableKit';
import EmptyState from '@/components/shared/EmptyState';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';

type FilterKey = 'all' | 'Scheduled Service' | 'Repair' | 'Inspection' | 'Component Replacement';

const PILLS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Scheduled Service', label: 'Scheduled' },
  { key: 'Repair', label: 'Repair' },
  { key: 'Inspection', label: 'Inspection' },
  { key: 'Component Replacement', label: 'Replacement' },
];

/* ============================================================
   Engineer — Maintenance History (/engineer/history)
   12 months of fleet-wide records
   ============================================================ */

export default function MaintenanceHistory() {
  const { history } = useData();
  const loading = useMockLoading();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Set<FilterKey>>(new Set(['all']));
  const [aircraftFilter, setAircraftFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const aircraftIds = useMemo(() => [...new Set(history.map((h) => h.aircraftId))], [history]);

  const rows = useMemo(() => {
    let list = history.slice();
    const filters = [...active].filter((f): f is Exclude<FilterKey, 'all'> => f !== 'all');
    if (filters.length) list = list.filter((h) => filters.includes(h.type));
    if (aircraftFilter) list = list.filter((h) => h.aircraftId === aircraftFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((h) => h.task.toLowerCase().includes(q) || h.crew.toLowerCase().includes(q) || h.aircraftId.toLowerCase().includes(q));
    }
    return list;
  }, [history, active, query, aircraftFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance History"
        subtitle={`${history.length} records across 12 months — full audit trail for every airframe`}
        help="Every completed task logged by the crew, synced from the maintenance data link."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between ag-fade">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="Search task, crew or aircraft…" />
          <select
            value={aircraftFilter}
            onChange={(e) => { setAircraftFilter(e.target.value); setPage(0); }}
            className="h-9 rounded border border-slate-200 px-2.5 text-sm text-slate-600 focus:outline-none focus:border-navy"
            aria-label="Filter by aircraft"
          >
            <option value="">All aircraft</option>
            {aircraftIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <FilterPills
          pills={PILLS}
          active={active}
          onToggle={(k) => {
            const next = new Set(active);
            if (k === 'all') {
              next.clear();
              next.add('all');
            } else {
              next.delete('all');
              if (next.has(k)) next.delete(k);
              else next.add(k);
              if (next.size === 0) next.add('all');
            }
            setActive(next);
            setPage(0);
          }}
          onClear={() => setActive(new Set(['all']))}
        />
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : rows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={SearchX} title="No history records match" message="Try a different aircraft or task filter." />
        </div>
      ) : (
        <div className="ag-card overflow-x-auto ag-fade ag-fade-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                {['Date', 'Aircraft', 'Task', 'Type', 'Crew', 'Duration'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginate(rows, page, PAGE_SIZE).map((h) => (
                <tr key={h.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtDate(h.date)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">
                    <Link to={`/engineer/aircraft/${h.aircraftId}`} className="hover:text-navy hover:underline">
                      {h.aircraftId}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{h.task}</td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-semibold bg-cloud text-slate-500 rounded px-1.5 py-0.5">{h.type}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{h.crew}</td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{h.durationHours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination total={rows.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}
