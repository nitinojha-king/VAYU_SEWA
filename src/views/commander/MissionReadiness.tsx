'use client';

import { useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Plane,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import { StatusBadge } from '@/components/shared/Badge';
import AircraftDecisionDrawer from '@/components/commander/AircraftDecisionDrawer';
import FleetAvailabilityForecast from '@/components/commander/FleetAvailabilityForecast';
import CommandActivityLog from '@/components/commander/CommandActivityLog';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useCommand } from '@/context/CommandContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonStat, SkeletonChart } from '@/components/shared/SkeletonLoader';
import { isMissionReady } from '@/utils/selectors';
import { healthColor } from '@/utils/healthCalculator';
import { buildForecast } from '@/data/commanderData';
import { missionFor, RISK_TONE, type MissionRisk } from '@/data/commanderData';

/* ============================================================
   Commander — Mission Readiness & Command Decision Center
   (/commander/readiness)

   Frontend-only simulation over the existing mock fleet. The
   decision flow — what is wrong, why it matters, what to do —
   is driven by React state in CommandContext.
   ============================================================ */

export default function MissionReadiness() {
  const { aircraft } = useSensors();
  const { predictions, workOrders } = useData();
  const { openAircraftId, openAircraft, decisionFor, statusAfter, riskAfter } = useCommand();
  const loading = useMockLoading();

  const ready = aircraft.filter((a) => isMissionReady(a, predictions));
  const readinessPct = Math.round((ready.length / Math.max(1, aircraft.length)) * 100);

  const openAc = useMemo(
    () => aircraft.find((a) => a.id === openAircraftId) ?? null,
    [aircraft, openAircraftId]
  );

  const aog = aircraft.filter((a) => a.status === 'grounded').length;
  const criticalMaint = aircraft.filter(
    (a) => a.status === 'maintenance' || a.status === 'critical'
  ).length;
  const atRisk = aircraft.filter((a) => missionFor(a.id)?.impact === 'HIGH').length;
  const forecast24 = buildForecast(readinessPct)[3].value;

  /* rows: every aircraft with an assigned mission, most urgent first */
  const rows = useMemo(() => {
    return aircraft
      .filter((a) => missionFor(a.id))
      .map((a) => {
        const mission = missionFor(a.id)!;
        const pred = predictions
          .filter((p) => p.aircraftId === a.id)
          .sort((x, y) => y.confidence - x.confidence)[0];
        const current: MissionRisk = mission.impact;
        const risk = riskAfter(a.id, current);
        const base: MissionRisk = current;
        return {
          ac: a,
          mission,
          risk,
          base,
          issue: pred?.component ?? null,
          action:
            decisionFor(a.id)?.state === 'approved'
              ? 'Approved'
              : decisionFor(a.id)?.state === 'overridden'
                ? 'Overridden'
                : risk === 'HIGH'
                  ? 'Inspect'
                  : pred
                    ? 'Schedule'
                    : 'Deploy',
        };
      })
      .sort((x, y) => {
        const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
        return rank[x.risk] - rank[y.risk] || x.ac.healthScore - y.ac.healthScore;
      });
  }, [aircraft, predictions, riskAfter, decisionFor]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission Readiness"
        subtitle="Operational readiness and mission impact across the fleet"
        help="Each row links an airframe to its assigned sortie. Risk reflects the live sensor state, the active fault prediction and any Commander decision already taken."
      />

      {loading ? (
        <SkeletonStat count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard icon={ShieldCheck} value={`${readinessPct}%`} label="Fleet Readiness" iconColor="#22C55E" iconBg="rgba(34,197,94,0.1)" />
          <StatCard icon={ShieldAlert} value={atRisk} label="Missions at Risk" iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)" delay={40} />
          <StatCard icon={Plane} value={aog} label="AOG Aircraft" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={80} />
          <StatCard icon={Wrench} value={criticalMaint} label="Critical Maintenance" delay={120} />
          <StatCard icon={TrendingUp} value={`${forecast24}%`} label="24h Forecast" sub={`target 90%`} delay={160} />
        </div>
      )}

      {/* readiness table */}
      <section className="ag-card p-5 ag-fade ag-fade-2">
        <SectionHeader
          title="Mission Readiness Board"
          help="Click any airframe to open the decision drawer — what is wrong, why it matters, and what to do."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Aircraft', 'Mission', 'Readiness', 'Risk', 'Predicted Issue', 'Mission Impact', 'Action'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ ac, mission, risk, issue, action }) => {
                const approved = decisionFor(ac.id)?.state === 'approved';
                return (
                  <tr
                    key={ac.id}
                    onClick={() => openAircraft(ac.id)}
                    className="border-b border-slate-50 hover:bg-cloud/70 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-800">{ac.id}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">{ac.name}</span>
                      <div className="mt-1">
                        <StatusBadge status={statusAfter(ac)} />
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-700">{mission.name}</p>
                      <p className="text-[10px] text-slate-400">{mission.startTime} · {mission.duration}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: healthColor(ac.healthScore) }}
                      >
                        {Math.round(ac.healthScore)}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${RISK_TONE[risk]}`}>
                        {risk}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-slate-600 whitespace-nowrap">
                      {issue ?? <span className="text-slate-300">None</span>}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-slate-600 whitespace-nowrap">
                      {mission.sorties} mission{mission.sorties > 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-[11px] font-semibold whitespace-nowrap ${
                          approved ? 'text-ok' : risk === 'HIGH' ? 'text-bad' : 'text-navy'
                        }`}
                      >
                        {action}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-xs text-slate-400">
                    No missions assigned in the current planning window.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* forecast + activity log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="ag-card p-5 ag-fade ag-fade-3">
          <SectionHeader
            title="Fleet Availability Forecast"
            help="Projected mission-capable fleet over the next 24 hours against the 90% target."
          />
          {loading ? <SkeletonChart h={200} /> : <FleetAvailabilityForecast currentPct={readinessPct} />}
          <p className="mt-2 text-[11px] text-slate-400">
            {ready.length} of {aircraft.length} airframes currently mission capable ·{' '}
            {workOrders.filter((w) => w.status !== 'completed').length} open work orders
          </p>
        </section>

        <CommandActivityLog />
      </div>

      <AircraftDecisionDrawer aircraft={openAc} onClose={() => openAircraft(null)} />
    </div>
  );
}