'use client';

import { ChevronRight } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import { useCommand } from '@/context/CommandContext';
import { buildPriorityQueue } from '@/data/missionImpact';
import type { ImpactRisk } from '@/data/missionImpact';

/* ============================================================
   Commander — Command Priority Queue.

   Ranks the fleet by operational urgency and opens the Mission
   Impact Simulator for whichever airframe the Commander picks.
   ============================================================ */

const RISK_DOT: Record<ImpactRisk, string> = {
  LOW: 'bg-ok',
  MEDIUM: 'bg-warn',
  HIGH: 'bg-bad',
  CRITICAL: 'bg-bad',
};

export default function CommandPriorityQueue() {
  const { aircraft } = useSensors();
  const {
    openAircraftId,
    mapAircraftId,
    selectMapAircraft,
    decisionFor,
    substitutionFor,
  } = useCommand();

  const queue = buildPriorityQueue(aircraft);

  if (!queue.length) return null;

  return (
    <section className="ag-card p-5 ag-fade ag-fade-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Command Priority Queue</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ranked by operational urgency — click an airframe to model its mission impact.
          </p>
        </div>
        <span className="text-[10px] text-slate-300">Simulated operational scenario</span>
      </div>

      <ul className="divide-y divide-slate-50">
        {queue.map(({ aircraft: ac, profile, rank }) => {
          const decision = decisionFor(ac.id);
          const sub = substitutionFor(ac.id);
          const isOpen = openAircraftId === ac.id || mapAircraftId === ac.id;
          const resolved = decision?.state === 'approved' || !!sub;

          return (
            <li
              key={ac.id}
              className={`flex flex-wrap items-center gap-3 py-2.5 px-2 -mx-2 rounded-md transition-colors ${
                isOpen ? 'bg-navy-soft/50' : ''
              }`}
            >
              <span className="w-5 shrink-0 text-[11px] font-bold tabular-nums text-slate-300">
                {String(rank).padStart(2, '0')}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${RISK_DOT[profile.risk]}`} />

              <div className="min-w-[190px] flex-1">
                <p className="text-xs font-bold text-slate-800">
                  {ac.id}
                  <span className="font-medium text-slate-500"> — {ac.name}</span>
                </p>
                <p className="text-[11px] text-slate-500 truncate">{profile.currentIssue}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                    resolved
                      ? 'border-ok/25 bg-ok/10 text-ok'
                      : profile.risk === 'CRITICAL' || profile.risk === 'HIGH'
                        ? 'border-bad/25 bg-bad/10 text-bad'
                        : 'border-warn/25 bg-warn/10 text-warn'
                  }`}
                >
                  {resolved ? 'Actioned' : profile.risk}
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {profile.failureWindowLabel} remaining
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {profile.sortiesAffected} sortie{profile.sortiesAffected === 1 ? '' : 's'} affected
                </span>
                {profile.partsImpact.toLowerCase().includes('short') ||
                profile.partsImpact.toLowerCase().includes('not held') ? (
                  <span className="rounded-full border border-slate-200 bg-cloud px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                    Parts shortage
                  </span>
                ) : null}
              </div>

              <button
                onClick={() => selectMapAircraft(ac.id)}
                className={`h-7 shrink-0 rounded-md border px-2.5 text-[10px] font-bold uppercase tracking-wide transition-colors inline-flex items-center gap-1 ${
                  isOpen
                    ? 'bg-navy text-white border-navy'
                    : 'border-navy/20 bg-navy-soft text-navy hover:bg-navy hover:text-white'
                }`}
              >
                View Impact <ChevronRight size={11} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}