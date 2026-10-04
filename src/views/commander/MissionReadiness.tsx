'use client';

import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import FleetDonutChart from '@/components/charts/FleetDonutChart';
import { StatusBadge } from '@/components/shared/Badge';
import ProgressBar from '@/components/shared/ProgressBar';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonStat, SkeletonChart } from '@/components/shared/SkeletonLoader';
import { isMissionReady, readinessProjection } from '@/utils/selectors';
import { healthColor } from '@/utils/healthCalculator';
import { hoursToHuman } from '@/utils/helpers';

/* ============================================================
   Commander — Mission Readiness (/commander/readiness)
   ============================================================ */

export default function MissionReadiness() {
  const { aircraft } = useSensors();
  const { predictions, workOrders } = useData();
  const loading = useMockLoading();

  const ready = aircraft.filter((a) => isMissionReady(a, predictions));
  const notReady = aircraft.filter((a) => !isMissionReady(a, predictions));
  const projection = readinessProjection(aircraft, predictions, workOrders);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission Readiness"
        subtitle="Current and projected aircraft availability for mission planning"
        help="Projected availability accounts for work-order due dates and remaining maintenance hours."
      />

      {loading ? (
        <SkeletonStat count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={ShieldCheck} value={ready.length} label="Mission Ready" sub={`of ${aircraft.length} aircraft`} />
          <StatCard icon={ShieldAlert} value={notReady.length} label="Not Mission Capable" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={40} />
          <StatCard
            icon={Shield}
            value={`${Math.round((ready.length / Math.max(1, aircraft.length)) * 100)}%`}
            label="Readiness Rate"
            delay={80}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="ag-card p-5 ag-fade ag-fade-2">
          <SectionHeader title="Ready vs Not Ready" help="Live split of the fleet by mission capability." />
          {loading ? <SkeletonChart h={190} /> : <FleetDonutChart ready={ready.length} total={aircraft.length} />}
          <div className="mt-4 space-y-2">
            {projection.map((row) => (
              <div key={row.window} className="flex items-center justify-between rounded-lg bg-cloud px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${row.tone === 'ok' ? 'bg-ok' : 'bg-warn'}`} />
                  <span className="text-xs font-semibold text-slate-700 w-20">{row.window}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 hidden md:block max-w-[220px] truncate">{row.note}</span>
                  <span className="text-sm font-bold text-navy tabular-nums">{row.ready} ready</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ag-card p-5 ag-fade ag-fade-3">
          <SectionHeader title="Ready Aircraft" help="Operational airframes with no critical fault prediction." />
          <ul className="space-y-2 max-h-[420px] overflow-y-auto ag-scroll pr-1">
            {ready.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3.5 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">
                    {a.id} <span className="font-medium text-slate-500">· {a.name}</span>
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar value={a.healthScore} color={healthColor(a.healthScore)} height={4} />
                  </div>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: healthColor(a.healthScore) }}>
                  {Math.round(a.healthScore)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ag-card p-5 ag-fade ag-fade-4">
        <SectionHeader title="Not Mission Capable — Reasons" help="Each non-ready airframe with the blocking cause." />
        <ul className="space-y-2">
          {notReady.map((a) => {
            const crit = predictions.filter((p) => p.aircraftId === a.id && p.severity === 'critical');
            const reason =
              a.status === 'maintenance'
                ? 'Scheduled maintenance in progress'
                : a.status === 'grounded'
                  ? 'Grounded — safety hold'
                  : a.status === 'critical'
                    ? 'Critical status — awaiting parts'
                    : crit.length > 0
                      ? `Critical prediction: ${crit[0].component} (failure in ~${hoursToHuman(crit[0].estimatedFailureHours)})`
                      : a.status === 'warning'
                        ? 'Active warning prediction'
                        : 'Operational constraint';
            return (
              <li key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-slate-100 px-3.5 py-3">
                <p className="text-xs font-bold text-slate-800 w-40">
                  {a.id} <span className="font-medium text-slate-500">· {a.name}</span>
                </p>
                <StatusBadge status={a.status} />
                <p className="text-[11px] text-slate-500 flex-1">{reason}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
