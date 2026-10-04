'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import { SeverityBadge, PriorityBadge } from '@/components/shared/Badge';
import { SearchInput, FilterPills, SortableTh, Pagination, paginate } from '@/components/shared/TableKit';
import EmptyState from '@/components/shared/EmptyState';
import { useData } from '@/context/DataContext';
import { useMockLoading, hoursToHuman, timeAgo } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';

type FilterKey = 'all' | 'critical' | 'warning' | 'overdue';

/* ============================================================
   Commander — Critical Alerts (/commander/alerts)
   ============================================================ */

interface AlertRow {
  id: string;
  kind: 'prediction' | 'workorder';
  aircraftId: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning';
  when: string;
}

const PILLS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'overdue', label: 'Overdue WOs' },
];

export default function Alerts() {
  const { predictions, workOrders } = useData();
  const loading = useMockLoading();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Set<FilterKey>>(new Set(['all']));
  const [sort, setSort] = useState<{ key: 'severity' | 'when' | 'aircraftId'; dir: 'asc' | 'desc' } | null>({
    key: 'when',
    dir: 'asc',
  });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const rows = useMemo<AlertRow[]>(() => {
    const preds: AlertRow[] = predictions.map((p) => ({
      id: p.id,
      kind: 'prediction',
      aircraftId: p.aircraftId,
      title: `${p.component} failure predicted`,
      detail: `${p.confidence}% confidence · failure in ~${hoursToHuman(p.estimatedFailureHours)} · ${p.recommendedAction}`,
      severity: p.severity,
      when: p.detectedAtTs.toString(),
    }));
    const wos: AlertRow[] = workOrders
      .filter((w) => w.status !== 'completed')
      .map((w) => {
        const overdue = new Date(w.dueBy).getTime() < Date.now();
        return {
          id: w.id,
          kind: 'workorder' as const,
          aircraftId: w.aircraftId,
          title: `Work order ${overdue ? 'overdue' : 'open'} — ${w.task}`,
          detail: `${w.assignedCrew} · due ${new Date(w.dueBy).toLocaleDateString('en-IN')} · ${w.partsRequired.join(', ') || 'no parts'}`,
          severity: overdue || w.priority === 'critical' ? ('critical' as const) : ('warning' as const),
          when: w.createdAt,
        };
      });
    let all = [...preds, ...wos];
    const filters = [...active].filter((f) => f !== 'all');
    if (filters.length) {
      all = all.filter((r) => {
        if (filters.includes('critical') && r.severity === 'critical') return true;
        if (filters.includes('warning') && r.severity === 'warning') return true;
        if (filters.includes('overdue') && r.kind === 'workorder' && new Date(workOrders.find((w) => w.id === r.id)?.dueBy ?? 0).getTime() < Date.now()) return true;
        return false;
      });
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      all = all.filter((r) => r.aircraftId.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
    }
    if (sort) {
      all.sort((a, b) => {
        let d = 0;
        if (sort.key === 'severity') d = (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1);
        else if (sort.key === 'when') d = Number(a.when) - Number(b.when);
        else d = a.aircraftId.localeCompare(b.aircraftId);
        return sort.dir === 'asc' ? d : -d;
      });
    }
    return all;
  }, [predictions, workOrders, active, query, sort]);

  const onSort = (key: 'severity' | 'when' | 'aircraftId') => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Alerts"
        subtitle="All active fault predictions and open work orders across the fleet"
        help="Auto-anomaly predictions appear here the moment 3 consecutive out-of-range readings are captured."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between ag-fade">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="Search aircraft or alert…" />
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
        <SkeletonTable rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={AlertTriangle} title="No alerts match your filters" message="Fleet sensors are nominal for the current filter set." />
        </div>
      ) : (
        <div className="ag-card overflow-x-auto ag-fade ag-fade-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                <SortableTh label="Aircraft" colKey="aircraftId" sort={sort} onSort={onSort} />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Alert</th>
                <SortableTh label="Severity" colKey="severity" sort={sort} onSort={onSort} />
                <SortableTh label="When" colKey="when" sort={sort} onSort={onSort} />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kind</th>
              </tr>
            </thead>
            <tbody>
              {paginate(rows, page, PAGE_SIZE).map((r) => (
                <tr key={r.kind + r.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                  <td className="px-3 py-3.5 text-xs font-bold text-slate-800">{r.aircraftId}</td>
                  <td className="px-3 py-3.5">
                    <p className="text-xs font-semibold text-slate-700">{r.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">{r.detail}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <SeverityBadge severity={r.severity} />
                  </td>
                  <td className="px-3 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                    {r.kind === 'prediction' ? timeAgo(Number(r.when)) : new Date(Number(r.when)).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-3 py-3.5">
                    {r.kind === 'prediction' ? (
                      <span className="text-[10px] font-semibold text-navy bg-navy-soft rounded px-1.5 py-0.5">PREDICTION</span>
                    ) : (
                      <PriorityBadge priority={(workOrders.find((w) => w.id === r.id)?.priority ?? 'medium') as 'medium'} />
                    )}
                  </td>
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
