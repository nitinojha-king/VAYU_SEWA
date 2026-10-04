'use client';

import { useMemo, useState } from 'react';
import { Brain, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Tooltip';
import { SeverityBadge } from '@/components/shared/Badge';
import ProgressBar from '@/components/shared/ProgressBar';
import ConfidenceRing from '@/components/charts/ConfidenceRing';
import { SearchInput, FilterPills, SortableTh, Pagination, paginate } from '@/components/shared/TableKit';
import EmptyState from '@/components/shared/EmptyState';
import WorkOrderModal, { type WOPrefill } from '@/components/shared/WorkOrderModal';
import { useData } from '@/context/DataContext';
import { useMockLoading, hoursToHuman, timeAgo } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';

type FilterKey = 'all' | 'critical' | 'warning' | 'under24';

const PILLS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'under24', label: 'Failure < 24h' },
];

/* ============================================================
   Engineer — Fault Predictions (/engineer/predictions)
   ============================================================ */

export default function FaultPredictions() {
  const { predictions } = useData();
  const loading = useMockLoading();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Set<FilterKey>>(new Set(['all']));
  const [sort, setSort] = useState<{ key: 'severity' | 'confidence' | 'eta'; dir: 'asc' | 'desc' }>({ key: 'severity', dir: 'asc' });
  const [page, setPage] = useState(0);
  const [prefill, setPrefill] = useState<WOPrefill | null>(null);
  const [open, setOpen] = useState(false);
  const PAGE_SIZE = 10;

  const rows = useMemo(() => {
    let list = predictions.slice();
    const filters = [...active].filter((f) => f !== 'all');
    if (filters.length) {
      list = list.filter((p) => {
        if (filters.includes('critical') && p.severity === 'critical') return true;
        if (filters.includes('warning') && p.severity === 'warning') return true;
        if (filters.includes('under24') && p.estimatedFailureHours < 24) return true;
        return false;
      });
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.aircraftId.toLowerCase().includes(q) || p.component.toLowerCase().includes(q));
    }
    const sevRank = (s: string) => (s === 'critical' ? 0 : 1);
    list.sort((a, b) => {
      let d = 0;
      if (sort.key === 'severity') d = sevRank(a.severity) - sevRank(b.severity);
      else if (sort.key === 'confidence') d = a.confidence - b.confidence;
      else d = a.estimatedFailureHours - b.estimatedFailureHours;
      return sort.dir === 'asc' ? d : -d;
    });
    return list;
  }, [predictions, active, query, sort]);

  const onSort = (key: 'severity' | 'confidence' | 'eta') =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Fault Predictions"
        subtitle="ML output across the fleet — sorted by severity, with one-click work-order creation"
        help="Predictions arrive from trained degradation models and the live anomaly engine (3 consecutive out-of-range readings)."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between ag-fade">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="Search aircraft or component…" />
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
        <SkeletonTable rows={6} cols={6} />
      ) : rows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={Brain} title="No active fault predictions" message="Fleet sensors are nominal. The anomaly engine is watching." />
        </div>
      ) : (
        <div className="ag-card overflow-x-auto ag-fade ag-fade-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aircraft</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Component</th>
                <SortableTh label="Confidence" colKey="confidence" sort={sort} onSort={onSort} />
                <SortableTh label="Est. Failure" colKey="eta" sort={sort} onSort={onSort} />
                <SortableTh label="Severity" colKey="severity" sort={sort} onSort={onSort} />
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginate(rows, page, PAGE_SIZE).map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                  <td className="px-3 py-3.5 text-xs font-bold text-slate-800">
                    <Link to={`/engineer/aircraft/${p.aircraftId}`} className="hover:text-navy hover:underline">
                      {p.aircraftId}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-normal ml-1.5">detected {p.detectedAt === 'just now' ? timeAgo(p.detectedAtTs) : p.detectedAt}</span>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-600 max-w-[220px]">
                    <p className="font-medium text-slate-700">{p.component}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.recommendedAction}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1">
                        <ProgressBar
                          value={p.confidence}
                          color={p.confidence >= 80 ? '#EF4444' : p.confidence >= 65 ? '#F59E0B' : '#1B2B4B'}
                          height={5}
                        />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-slate-600">{p.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        p.estimatedFailureHours < 24 ? 'text-bad' : p.estimatedFailureHours < 168 ? 'text-warn' : 'text-slate-500'
                      }`}
                    >
                      {hoursToHuman(p.estimatedFailureHours)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <SeverityBadge severity={p.severity} />
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setPrefill({
                          aircraftId: p.aircraftId,
                          task: p.recommendedAction,
                          priority: p.severity === 'critical' ? 'critical' : 'high',
                          partsRequired: p.partsRequired,
                          estimatedHours: 4,
                          fromPredictionId: p.id,
                        });
                        setOpen(true);
                      }}
                      className="h-8 px-3 rounded-md bg-navy text-white text-[11px] font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1"
                    >
                      <Plus size={12} /> Create Work Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination total={rows.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />

      {/* critical spotlight */}
      {rows.filter((p) => p.severity === 'critical').length > 0 ? (
        <section>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Critical — act within hours</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rows
              .filter((p) => p.severity === 'critical')
              .slice(0, 3)
              .map((p, i) => (
                <div key={p.id} className="ag-card p-4 flex items-center gap-4 ag-fade" style={{ animationDelay: `${i * 50}ms` }}>
                  <ConfidenceRing value={p.confidence} size={70} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">
                      {p.aircraftId} · {p.component}
                    </p>
                    <p className="text-sm font-bold text-bad mt-0.5">~{hoursToHuman(p.estimatedFailureHours)} to failure</p>
                    <Link to={`/engineer/aircraft/${p.aircraftId}`} className="text-[11px] font-semibold text-navy hover:underline mt-1 inline-block">
                      Open aircraft view →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <WorkOrderModal open={open} onClose={() => setOpen(false)} prefill={prefill} />
    </div>
  );
}
