'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import { useCommand } from '@/context/CommandContext';
import ApproveConfirmModal from '@/components/commander/ApproveConfirmModal';
import OverrideModal from '@/components/commander/OverrideModal';
import {
  BASELINE_AVAILABILITY,
  DEMO_DECISION,
  FEATURED_DECISION_ID,
  missionFor,
  RISK_TONE,
} from '@/data/commanderData';

/* ============================================================
   Commander — "Command Decision Required" card.

   Sits under the existing fleet KPI row on Fleet Overview.
   All three buttons act locally: open the drawer, confirm an
   approval, or record an override. Nothing navigates.
   ============================================================ */

export default function CommandDecisionSummary() {
  const { aircraft, fleetHealth } = useSensors();
  const { decisionFor, approve, override, statusAfter, riskAfter, projectedAfter, openAircraft } =
    useCommand();

  const [approveOpen, setApproveOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const ac = aircraft.find((a) => a.id === FEATURED_DECISION_ID) ?? null;
  if (!ac) return null;

  const decision = decisionFor(ac.id);
  const approved = decision?.state === 'approved';
  const isOverridden = decision?.state === 'overridden';
  const resolved = approved || isOverridden;

  const mission = missionFor(ac.id);
  const currentRisk = mission?.impact ?? 'HIGH';
  const risk = approved ? 'LOW' : isOverridden ? 'HIGH' : riskAfter(ac.id, currentRisk);
  const status = statusAfter(ac);

  const recommendation = approved
    ? `Inspection initiated — ${ac.id} unavailable for mission`
    : isOverridden
      ? `Recommendation overridden — ${ac.id} retained in service`
      : `Ground ${ac.id} and initiate ${DEMO_DECISION.issue.toLowerCase()} inspection`;

  return (
    <>
      <section
        className={`ag-card p-5 ag-fade ag-fade-2 border-l-[3px] ${
          approved ? 'border-l-ok' : isOverridden ? 'border-l-warn' : 'border-l-bad'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Command Decision Required
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  approved
                    ? 'border-ok/25 bg-ok/10 text-ok'
                    : isOverridden
                      ? 'border-warn/25 bg-warn/10 text-warn'
                      : 'border-bad/25 bg-bad/10 text-bad'
                }`}
              >
                {approved ? 'Action approved' : isOverridden ? 'Overridden' : 'High risk'}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2.5">
              <ShieldAlert size={18} className={approved ? 'text-ok' : 'text-bad'} />
              <p className="text-lg font-bold text-slate-900 tracking-tight">
                {ac.id}
                <span className="font-medium text-slate-500"> — {ac.name}</span>
              </p>
            </div>

            <p className="mt-1.5 text-xs text-slate-600">
              <AlertTriangle size={12} className="inline mr-1 -mt-0.5 text-warn" />
              {DEMO_DECISION.issue}
              <span className="text-slate-400"> · </span>
              {DEMO_DECISION.confidence}% confidence
              <span className="text-slate-400"> · </span>
              failure in {DEMO_DECISION.failureWindow}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  RISK_TONE[risk as 'LOW' | 'MEDIUM' | 'HIGH']
                }`}
              >
                Mission risk: {risk}
              </span>
              <span className="rounded-full border border-slate-200 bg-cloud px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Status: {status}
              </span>
              <span className="rounded-full border border-slate-200 bg-cloud px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {mission
                  ? `${mission.sorties} mission${mission.sorties > 1 ? 's' : ''} at risk · ${mission.name}`
                  : 'No mission assigned'}
              </span>
              <span className="rounded-full border border-slate-200 bg-cloud px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Fleet availability {projectedAfter(ac.id, BASELINE_AVAILABILITY)}%
              </span>
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              System recommendation
            </p>
            <p className="text-xs font-bold text-navy">{recommendation}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Simulated demo values · part {DEMO_DECISION.partId} · {DEMO_DECISION.engineersAvailable} engineers available
            </p>
          </div>

          {/* three local actions — none of these navigate */}
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <button
              onClick={() => openAircraft(ac.id)}
              className="h-9 rounded-md bg-navy px-4 text-xs font-semibold text-white hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-1.5"
            >
              View Decision <ArrowRight size={13} />
            </button>
            <button
              onClick={() => setApproveOpen(true)}
              disabled={resolved}
              className={`h-9 rounded-md px-4 text-xs font-semibold transition-colors ${
                approved
                  ? 'bg-ok/10 text-ok border border-ok/25 cursor-default'
                  : isOverridden
                    ? 'bg-cloud text-slate-400 border border-slate-100 cursor-not-allowed'
                    : 'bg-navy-soft text-navy border border-navy/20 hover:bg-navy hover:text-white'
              }`}
            >
              {approved ? 'Approved' : isOverridden ? 'Overridden' : 'Approve'}
            </button>
            <button
              onClick={() => setOverrideOpen(true)}
              disabled={approved}
              className={`h-9 rounded-md border px-4 text-xs font-semibold transition-colors ${
                approved
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : isOverridden
                    ? 'bg-warn/10 text-warn border border-warn/25 cursor-default'
                    : 'border-slate-200 text-slate-600 hover:border-bad/40 hover:text-bad'
              }`}
            >
              Override
            </button>
            <p className="mt-1 text-center text-[10px] text-slate-400">
              Fleet health {fleetHealth}%
            </p>
          </div>
        </div>
      </section>

      <ApproveConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        aircraftId={ac.id}
        aircraftName={ac.name}
        action={`Ground aircraft and initiate ${DEMO_DECISION.issue.toLowerCase()} inspection`}
        onConfirm={() => approve(ac.id, ac.name)}
      />

      <OverrideModal
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        aircraftId={ac.id}
        aircraftName={ac.name}
        onConfirm={(reason, notes) => override(ac.id, ac.name, reason, notes)}
      />
    </>
  );
}