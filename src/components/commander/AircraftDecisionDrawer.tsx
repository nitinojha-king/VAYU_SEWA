'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Gauge,
  Target,
} from 'lucide-react';
import type { Aircraft } from '@/data/types';
import { COMPONENT_LABELS, healthColor } from '@/utils/healthCalculator';
import { StatusBadge } from '@/components/shared/Badge';
import SlideOver from '@/components/shared/SlideOver';
import ProgressBar from '@/components/shared/ProgressBar';
import MissionImpactSimulator from '@/components/commander/MissionImpactSimulator';
import ApproveConfirmModal from '@/components/commander/ApproveConfirmModal';
import OverrideModal from '@/components/commander/OverrideModal';
import { useSensors } from '@/context/SensorContext';
import { useCommand } from '@/context/CommandContext';
import { buildEvidence, missionFor, type MissionRisk } from '@/data/commanderData';
import { getMissionImpactProfile, type ImpactRisk } from '@/data/missionImpact';
import { fmtDate } from '@/utils/helpers';

/* ============================================================
   Commander — Aircraft Decision Drawer

   ONE drawer for every airframe. All content is derived from the
   selected aircraft's own MissionImpactProfile, so AC-012,
   AC-007, AC-003 and every other aircraft render the same
   simulator with their own scenario.
   ============================================================ */

const EVIDENCE_TONE = {
  Normal: 'text-ok',
  Elevated: 'text-warn',
  Abnormal: 'text-bad',
} as const;

const RISK_STYLE: Record<ImpactRisk, string> = {
  LOW: 'bg-ok/10 text-ok border-ok/25',
  MEDIUM: 'bg-warn/10 text-warn border-warn/25',
  HIGH: 'bg-bad/10 text-bad border-bad/25',
  CRITICAL: 'bg-bad text-white border-bad',
};

const COMPONENT_ORDER = ['engine', 'hydraulic', 'avionics', 'fuelSystem', 'landingGear'] as const;

/** maps the profile's component to the sensor channel that evidences it */
const FOCUS_METRIC = {
  engine: 'vibration',
  hydraulic: 'oilPressure',
  avionics: 'engineTemp',
  fuelSystem: 'fuelFlow',
  landingGear: 'oilPressure',
} as const;

function SubHead({ icon: Icon, children }: { icon: typeof Gauge; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2.5">
      <Icon size={12} className="text-slate-400" />
      {children}
    </h3>
  );
}

export default function AircraftDecisionDrawer({
  aircraft,
  onClose,
}: {
  aircraft: Aircraft | null;
  onClose: () => void;
}) {
  const { latest } = useSensors();
  const { decisionFor, approve, override, riskAfter, statusAfter } = useCommand();
  const [approveOpen, setApproveOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  if (!aircraft) return null;
  const ac = aircraft;

  const profile = getMissionImpactProfile(ac);
  const decision = decisionFor(ac.id);
  const approved = decision?.state === 'approved';
  const isOverridden = decision?.state === 'overridden';
  const reading = latest[ac.id];
  const mission = missionFor(ac.id);
  const evidence = buildEvidence(reading, FOCUS_METRIC[profile.componentKey]);

  const currentRisk = (mission?.impact ?? 'LOW') as MissionRisk;
  const riskNow = approved ? 'LOW' : isOverridden ? 'HIGH' : riskAfter(ac.id, currentRisk);

  const recommendation = approved
    ? `INSPECTION INITIATED — ${ac.id} UNAVAILABLE FOR MISSION`
    : isOverridden
      ? `${ac.id} RETURNED TO SERVICE — OVERRIDE ON RECORD`
      : `GROUND ${ac.id} + INITIATE INSPECTION`;

  const why = approved
    ? [
        `High predicted ${COMPONENT_LABELS[profile.componentKey].toLowerCase()} risk`,
        mission ? 'Mission currently assigned' : 'No mission currently assigned',
        `${profile.crewImpact}`,
        profile.partsImpact,
        'Grounding now reduces mission risk',
      ]
    : isOverridden
      ? [
          `Override recorded: ${decision?.overrideReason}`,
          decision?.overrideNotes ? `Note: ${decision?.overrideNotes}` : 'No additional note',
          `${ac.id} remains mission capable`,
        ]
      : [
          `Failure window ${profile.failureWindowLabel}`,
          `${profile.missionsAtRisk} mission(s) at risk · ${profile.sortiesAffected} sortie(s)`,
          profile.partsImpact,
          profile.crewImpact,
        ];

  return (
    <>
      <SlideOver
        open
        onClose={onClose}
        title={`${ac.id} — ${ac.name}`}
        subtitle={`${ac.type} · ${ac.squadron} · ${ac.base}`}
        width="max-w-xl"
      >
        <div className="space-y-5">
          {approved ? (
            <div className="rounded-lg border border-ok/25 bg-ok/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-ok">
                <CheckCircle2 size={16} /> Command Action Approved
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {ac.id} assigned for inspection. Aircraft status set to unavailable.
              </p>
            </div>
          ) : null}

          {isOverridden ? (
            <div className="rounded-lg border border-warn/25 bg-warn/5 p-4">
              <p className="text-sm font-bold text-warn">Override Recorded</p>
              <p className="mt-1 text-xs text-slate-600">
                Reason: {decision?.overrideReason}
                {decision?.overrideNotes ? ` — ${decision?.overrideNotes}` : ''}
              </p>
            </div>
          ) : null}

          {/* aircraft status */}
          <div>
            <SubHead icon={ClipboardList}>Aircraft Status</SubHead>
            <div className="rounded-lg border border-slate-100 p-3.5">
              <div className="flex items-center justify-between">
                <StatusBadge status={statusAfter(ac)} />
                <span className="text-lg font-bold tabular-nums" style={{ color: healthColor(ac.healthScore) }}>
                  {Math.round(ac.healthScore)}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={ac.healthScore} color={healthColor(ac.healthScore)} height={5} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[11px]">
                {[
                  ['Flight hours', `${ac.flightHours.toLocaleString('en-IN')} hrs`],
                  ['Engine cycles', ac.engineCycles.toLocaleString('en-IN')],
                  ['Current mission', mission ? mission.name : 'Unassigned'],
                  ['Base', ac.base],
                  ['Last maintenance', fmtDate(ac.lastMaintenance)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="font-semibold text-slate-700 mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* system health */}
          <div>
            <SubHead icon={Gauge}>System Health</SubHead>
            <div className="space-y-1.5">
              {COMPONENT_ORDER.map((k) => {
                const score = ac.components[k];
                const isFocus = k === profile.componentKey;
                const band = score > 80 ? 'ok' : score >= 50 ? 'warn' : 'bad';
                return (
                  <div
                    key={k}
                    className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 ${isFocus ? 'bg-navy-soft/60' : ''}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        band === 'ok' ? 'bg-ok' : band === 'warn' ? 'bg-warn' : 'bg-bad'
                      }`}
                    />
                    <span className="text-[11px] text-slate-600 flex-1">{COMPONENT_LABELS[k]}</span>
                    <span className="w-20">
                      <ProgressBar value={score} color={healthColor(score)} height={4} />
                    </span>
                    <span
                      className="text-[11px] font-bold tabular-nums w-9 text-right"
                      style={{ color: healthColor(score) }}
                    >
                      {Math.round(score)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* current issue */}
          <div>
            <SubHead icon={FileWarning}>Current Issue</SubHead>
            <div className="rounded-lg border border-bad/25 bg-bad/5 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">{profile.currentIssue}</p>
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${RISK_STYLE[profile.risk]}`}>
                  {profile.risk}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Confidence', `${profile.confidence}%`],
                  ['Time remaining', profile.failureWindowLabel],
                  ['Severity', profile.risk],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md bg-white/70 py-2">
                    <p className="text-[10px] text-slate-400">{k}</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Evidence
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {evidence.map((e) => (
                  <div
                    key={e.metric}
                    className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${
                      e.focus ? 'border-navy/25 bg-navy-soft/40' : 'border-slate-100'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 truncate">{e.label}</span>
                    <span className={`text-[10px] font-bold ${EVIDENCE_TONE[e.state]}`}>{e.state}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-300">
                Simulated evidence derived from live sensor telemetry.
              </p>
            </div>
          </div>

          {/* mission impact summary */}
          <div>
            <SubHead icon={Target}>Mission Impact</SubHead>
            <div className="rounded-lg border border-slate-100 p-3.5">
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Mission', mission?.name ?? 'Unassigned'],
                  ['Missions affected', String(profile.missionsAtRisk)],
                  ['Sorties affected', String(profile.sortiesAffected)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] text-slate-400">{k}</dt>
                    <dd className="text-[11px] font-bold text-slate-800 mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Mission risk</span>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${RISK_STYLE[currentRisk]}`}>
                    {currentRisk}
                  </span>
                  {riskNow !== currentRisk ? (
                    <>
                      <span className="text-slate-300 text-[10px]">&rarr;</span>
                      <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${RISK_STYLE[riskNow]}`}>
                        {riskNow}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* ---------- THE simulator ---------- */}
          <MissionImpactSimulator aircraft={ac} />

          {/* recommendation */}
          <div>
            <SubHead icon={ClipboardList}>System Recommendation</SubHead>
            <div className="rounded-lg border border-navy/20 bg-navy-soft/40 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-navy">{recommendation}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Why?</p>
              <ul className="mt-1 space-y-0.5">
                {why.map((r) => (
                  <li key={r} className="text-[11px] text-slate-600 flex gap-1.5">
                    <span className="text-navy-soft">—</span>
                    {r}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setApproveOpen(true)}
                  disabled={approved || isOverridden}
                  className={`h-8 flex-1 min-w-[130px] rounded-md text-[11px] font-semibold transition-colors ${
                    approved
                      ? 'bg-ok/10 text-ok border border-ok/25 cursor-default'
                      : isOverridden
                        ? 'bg-cloud text-slate-400 border border-slate-100 cursor-not-allowed'
                        : 'bg-navy text-white hover:bg-navy-hover'
                  }`}
                >
                  {approved ? 'Action approved' : 'Approve action'}
                </button>
                <button
                  onClick={() => setOverrideOpen(true)}
                  disabled={approved}
                  className="h-8 flex-1 min-w-[90px] rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600 hover:border-bad/40 hover:text-bad transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Override
                </button>
              </div>
            </div>
          </div>
        </div>
      </SlideOver>

      <ApproveConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        aircraftId={ac.id}
        aircraftName={ac.name}
        action={`Ground aircraft and initiate ${profile.currentIssue.toLowerCase()} inspection`}
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