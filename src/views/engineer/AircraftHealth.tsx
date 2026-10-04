'use client';

import { useMemo, useState } from 'react';
import { Brain, ClipboardList, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import ProgressBar from '@/components/shared/ProgressBar';
import { SearchInput, FilterPills } from '@/components/shared/TableKit';
import EmptyState from '@/components/shared/EmptyState';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonStat } from '@/components/shared/SkeletonLoader';
import { healthColor, healthBand, COMPONENT_LABELS } from '@/utils/healthCalculator';
import { fmtDate } from '@/utils/helpers';
import type { Aircraft, ComponentKey } from '@/data/types';

type FilterKey = 'all' | 'critical' | 'warning' | 'healthy';

const PILLS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'healthy', label: 'Healthy' },
];

/* ============================================================
   Engineer — Aircraft Health (/engineer)
   ============================================================ */

export default function AircraftHealth() {
  const { aircraft, fleetHealth } = useSensors();
  const { predictions, workOrders } = useData();
  const navigate = useNavigate();
  const loading = useMockLoading();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Set<FilterKey>>(new Set(['all']));

  const criticalCount = aircraft.filter((a) => a.status === 'critical' || a.status === 'grounded').length;
  const todayWos = workOrders.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString() || new Date(w.dueBy).toDateString() === new Date().toDateString()).length;

  const filtered = useMemo(() => {
    let rows = aircraft;
    const filters = [...active].filter((f) => f !== 'all');
    if (filters.length) {
      rows = rows.filter((a) =>
        filters.some((f) => {
          if (f === 'critical') return healthBand(a.healthScore) === 'critical' || a.status === 'critical' || a.status === 'grounded';
          if (f === 'warning') return healthBand(a.healthScore) === 'warning' || a.status === 'warning';
          return healthBand(a.healthScore) === 'healthy';
        })
      );
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((a) => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    return rows.slice().sort((a, b) => a.healthScore - b.healthScore);
  }, [aircraft, active, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aircraft Health Monitor"
        subtitle="Component-level condition across the fleet — drill into any airframe for live sensors, predictions and the digital twin"
        help="Health scores recalculate every 2 seconds from the live sensor feed using weighted component scores."
      />

      {loading ? (
        <SkeletonStat count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Brain} value={predictions.length} label="Active Fault Predictions" delay={0} />
          <StatCard icon={ClipboardList} value={todayWos} label="Work Orders Today" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={40} />
          <StatCard icon={AlertTriangle} value={criticalCount} label="Critical Aircraft" iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)" delay={80} />
          <StatCard icon={Activity} value={`${fleetHealth}%`} label="Avg Fleet Health" sub={`${aircraft.length} aircraft reporting`} delay={120} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between ag-fade ag-fade-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Filter aircraft by ID or name…" />
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
          }}
          onClear={() => setActive(new Set(['all']))}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={Activity} title="No aircraft match" message="Adjust the filter pills or clear the search." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <HealthCard key={a.id} aircraft={a} delay={i * 30} onOpen={() => navigate(`/engineer/aircraft/${a.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function HealthCard({ aircraft, onOpen, delay }: { aircraft: Aircraft; onOpen: () => void; delay: number }) {
  const { predictions } = useData();
  const critPreds = predictions.filter((p) => p.aircraftId === aircraft.id);

  return (
    <div
      className={`ag-card p-4 ag-fade hover:shadow-md transition-shadow ${
        healthBand(aircraft.healthScore) === 'critical'
          ? 'border-l-[3px] border-l-bad'
          : healthBand(aircraft.healthScore) === 'warning'
            ? 'border-l-[3px] border-l-warn'
            : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {aircraft.id} <span className="font-medium text-slate-500">· {aircraft.name}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Last maintained {fmtDate(aircraft.lastMaintenance)}</p>
        </div>
        <p className="text-3xl font-bold tabular-nums" style={{ color: healthColor(aircraft.healthScore) }}>
          {Math.round(aircraft.healthScore)}
        </p>
      </div>

      <div className="mt-3">
        <ProgressBar value={aircraft.healthScore} color={healthColor(aircraft.healthScore)} height={5} />
      </div>

      {/* component mini-grid */}
      <div className="grid grid-cols-5 gap-1.5 mt-3">
        {(Object.keys(aircraft.components) as ComponentKey[]).map((k) => {
          const v = aircraft.components[k];
          return (
            <div
              key={k}
              title={`${COMPONENT_LABELS[k]}: ${Math.round(v)}%`}
              className={`rounded px-1 py-1.5 text-center text-[9px] font-semibold border ${
                v >= 75
                  ? 'bg-ok/10 text-ok border-ok/20'
                  : v >= 50
                    ? 'bg-warn/10 text-warn border-warn/20'
                    : 'bg-bad/10 text-bad border-bad/20'
              }`}
            >
              {COMPONENT_LABELS[k].split(' ')[0]}
              <span className="block text-[10px] tabular-nums">{Math.round(v)}%</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3.5">
        <p className="text-[10px] text-slate-400">
          {critPreds.length > 0 ? (
            <span className="text-warn font-medium">
              {critPreds.length} active prediction{critPreds.length > 1 ? 's' : ''}
            </span>
          ) : (
            'No active predictions'
          )}
        </p>
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-navy-hover transition-colors"
        >
          View Details <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
