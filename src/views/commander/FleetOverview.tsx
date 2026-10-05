'use client';

import { useState } from 'react';
import {
  Plane,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import { StatusBadge, PriorityBadge } from '@/components/shared/Badge';
import AircraftCard from '@/components/shared/AircraftCard';
import AircraftSlideOver from '@/components/shared/AircraftSlideOver';
import CommandDecisionSummary from '@/components/commander/CommandDecisionSummary';
import CommandPriorityQueue from '@/components/commander/CommandPriorityQueue';
import FleetPositionMap from '@/components/commander/FleetPositionMap';
import AircraftDecisionDrawer from '@/components/commander/AircraftDecisionDrawer';
import { useCommand } from '@/context/CommandContext';
import HealthTrendChart from '@/components/charts/HealthTrendChart';
import FleetDonutChart from '@/components/charts/FleetDonutChart';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonStat, SkeletonChart } from '@/components/shared/SkeletonLoader';
import { isMissionReady, readinessProjection, next7DaysWork } from '@/utils/selectors';
import { fleetAverageHealth } from '@/utils/healthCalculator';
import { FLEET_TREND } from '@/data/mockOps';
import { fmtDate } from '@/utils/helpers';
import type { Aircraft } from '@/data/types';

/* ============================================================
   Commander — Fleet Overview (/commander)
   ============================================================ */

export default function FleetOverview() {
  const { aircraft, fleetHealth } = useSensors();
  const { predictions, workOrders } = useData();
  const loading = useMockLoading();
  const [selected, setSelected] = useState<Aircraft | null>(null);
  const { openAircraftId, openAircraft } = useCommand();

  const decisionAircraft =
    aircraft.find((a) => a.id === openAircraftId) ?? null;

  const operational = aircraft.filter((a) => a.status === 'operational').length;
  const maintenance = aircraft.filter((a) => a.status === 'maintenance').length;
  const critical = aircraft.filter((a) => a.status === 'critical' || a.status === 'grounded').length;
  const ready = aircraft.filter((a) => isMissionReady(a, predictions)).length;
  const projection = readinessProjection(aircraft, predictions, workOrders);
  const upcoming = next7DaysWork(workOrders).slice(0, 5);
  const topAlerts = predictions
    .slice()
    .sort((a, b) => a.estimatedFailureHours - b.estimatedFailureHours)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Overview"
        subtitle="Live command view of all 20 airframes — updated every 2 seconds from the sensor grid"
        help="Fleet health is the average of weighted component scores (Engine 40%, Hydraulic 20%, Avionics 20%, Landing Gear 10%, Fuel 10%) recalculated on every sensor tick."
      />

      {/* 1 — stat cards */}
      {loading ? (
        <SkeletonStat count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard icon={Plane} value={aircraft.length} label="Total Aircraft" delay={0} />
          <StatCard icon={CheckCircle} value={operational} label="Operational" iconColor="#22C55E" iconBg="rgba(34,197,94,0.1)" delay={40} />
          <StatCard icon={Wrench} value={maintenance} label="Under Maintenance" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={80} />
          <StatCard icon={AlertTriangle} value={critical} label="Critical / Grounded" iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)" delay={120} />
          <StatCard icon={Shield} value={ready} label="Mission Ready" sub={`Fleet health ${fleetHealth}%`} delay={160} />
        </div>
      )}

      {/* 2 — command decision */}
      {!loading ? <CommandDecisionSummary /> : null}

      {/* 3 — priority queue */}
      {!loading ? <CommandPriorityQueue /> : null}

      {/* 4 — operational map */}
      {!loading ? <FleetPositionMap /> : null}

      {/* 5 — status map */}
      <section className="ag-fade ag-fade-2">
        <SectionHeader
          title="Fleet Status Overview"
          help="Every airframe with live health bar and status. Click a card for the quick summary."
          right={
            <Link to="/commander/map" className="text-xs font-semibold text-navy hover:text-navy-hover inline-flex items-center gap-0.5">
              Full map <ChevronRight size={13} />
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aircraft.slice(0, 8).map((a) => (
            <AircraftCard key={a.id} aircraft={a} onClick={() => setSelected(a)} />
          ))}
        </div>
      </section>

      {/* 3 — health trend */}
      <section className="ag-card p-5 ag-fade ag-fade-3">
        <SectionHeader
          title="Fleet Health — Last 30 Days"
          help="Daily fleet-wide average health score, blended from component health and sensor degradation."
        />
        {loading ? <SkeletonChart h={220} /> : <HealthTrendChart data={FLEET_TREND} />}
      </section>

      {/* 4 — readiness + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="ag-card p-5 ag-fade ag-fade-4">
          <SectionHeader
            title="Mission Readiness"
            help="Mission-ready = operational with no active critical fault prediction."
            right={
              <Link to="/commander/readiness" className="text-xs font-semibold text-navy hover:text-navy-hover">
                Details
              </Link>
            }
          />
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <p className="text-4xl font-bold text-navy tabular-nums">{ready}</p>
              <p className="text-xs text-slate-400 mt-1">Aircraft ready</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Out of {aircraft.length} total fleet</p>
            </div>
            <div className="flex-1 min-w-0">
              <FleetDonutChart ready={ready} total={aircraft.length} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {projection.map((row) => (
              <div key={row.window} className="flex items-center justify-between rounded-lg bg-cloud px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${row.tone === 'ok' ? 'bg-ok' : 'bg-warn'}`} />
                  <span className="text-xs font-semibold text-slate-700 w-20">{row.window}</span>
                  <span className="text-[11px] text-slate-400 hidden sm:block">{row.note}</span>
                </div>
                <span className="text-sm font-bold text-navy tabular-nums">{row.ready} ready</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ag-card p-5 ag-fade ag-fade-5">
          <SectionHeader
            title="Active Alerts"
            help="Most urgent AI fault predictions across the fleet, sorted by time-to-failure."
            right={
              <Link to="/commander/alerts" className="text-xs font-semibold text-navy hover:text-navy-hover">
                View All Alerts
              </Link>
            }
          />
          <ul className="space-y-2.5">
            {topAlerts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3.5 py-3 hover:border-navy/20 transition-colors">
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.severity === 'critical' ? 'bg-bad' : 'bg-warn'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    {p.aircraftId} <span className="font-medium text-slate-500">· {p.component}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{p.recommendedAction}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={p.severity === 'critical' ? 'critical' : 'warning'} />
                  <p className="text-[10px] text-slate-400 mt-1">{p.detectedAt}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 5 — maintenance schedule */}
      <section className="ag-card p-5 ag-fade">
        <SectionHeader
          title="Upcoming Maintenance"
          help="Work orders due in the next 7 days across the fleet."
          right={
            <Link to="/commander/reports" className="text-xs font-semibold text-navy hover:text-navy-hover">
              View Full Schedule
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Aircraft ID', 'Task', 'Due Date', 'Status', 'Crew'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcoming.map((w) => (
                <tr key={w.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                  <td className="px-3 py-3 font-bold text-slate-800 text-xs">{w.aircraftId}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs">
                    {w.task}
                    <span className="text-slate-300 ml-2">{w.id}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{fmtDate(w.dueBy)}</td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={w.priority} />
                  </td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{w.assignedCrew}</td>
                </tr>
              ))}
              {upcoming.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-400">
                    No maintenance due in the next 7 days.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <AircraftSlideOver aircraft={selected} onClose={() => setSelected(null)} />

      {/* shared Mission Impact drawer — opened from the priority queue or the
          Command Decision card, for any airframe */}
      <AircraftDecisionDrawer
        aircraft={decisionAircraft}
        onClose={() => openAircraft(null)}
      />
    </div>
  );
}
