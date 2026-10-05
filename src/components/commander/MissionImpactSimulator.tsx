'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Package,
  Plane,
  TriangleAlert,
  Users,
} from 'lucide-react';
import type { Aircraft } from '@/data/types';
import { useSensors } from '@/context/SensorContext';
import { useCommand } from '@/context/CommandContext';
import SubstitutionModal from '@/components/commander/SubstitutionModal';
import {
  DURATION_LABEL,
  FLEET_AVAILABILITY_CURRENT,
  SQUADRON_READINESS_CURRENT,
  fleetLossOutcome,
  getAlternateAircraft,
  getMissionImpactProfile,
  impactFor,
  outcomeWithAlternate,
  partDelayOutcome,
  type AlternateCandidate,
  type DurationKey,
  type ImpactRisk,
  type ScenarioKind,
} from '@/data/missionImpact';
import { nearestStockSource } from '@/data/commanderData';

/* ============================================================
   MISSION IMPACT SIMULATOR

   One reusable, fully data-driven component. Every aircraft the
   Commander selects renders this same UI with its own profile —
   there is no per-aircraft variant. This replaces the previous
   fixed three-option What-If panel.
   ============================================================ */

const RISK_STYLE: Record<ImpactRisk, string> = {
  LOW: 'bg-ok/10 text-ok border-ok/25',
  MEDIUM: 'bg-warn/10 text-warn border-warn/25',
  HIGH: 'bg-bad/10 text-bad border-bad/25',
  CRITICAL: 'bg-bad text-white border-bad',
};

const CONFLICT_LABEL: Record<AlternateCandidate['maintenanceConflict'], string> = {
  NONE: 'None',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
};

function Metric({
  label,
  before,
  after,
  tone,
}: {
  label: string;
  before: number | string;
  after: number | string;
  tone?: 'up' | 'down';
}) {
  return (
    <div className="rounded-md bg-white/70 px-2 py-2 text-center">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-800">
        {before}
        <span className="text-slate-300 mx-0.5">&rarr;</span>
        <span className={tone === 'up' ? 'text-ok' : tone === 'down' ? 'text-bad' : ''}>
          {after}
        </span>
      </p>
    </div>
  );
}

export default function MissionImpactSimulator({
  aircraft,
  onOpenSubstitution,
}: {
  aircraft: Aircraft;
  onOpenSubstitution?: () => void;
}) {
  const { aircraft: fleet } = useSensors();
  const { partTransfer, requestTransfer, approveSubstitution, decisionFor } = useCommand();

  const profile = getMissionImpactProfile(aircraft);
  const [duration, setDuration] = useState<DurationKey>('48H');
  const [scenario, setScenario] = useState<ScenarioKind>('unavailable');
  const [alternateId, setAlternateId] = useState<string | null>(null);

  const impact = impactFor(profile, duration);
  const alternates = getAlternateAircraft(aircraft, fleet);
  const alternate = alternates.find((a) => a.aircraftId === alternateId) ?? null;
  const outcome = outcomeWithAlternate(profile, impact, alternate);
  const delay = partDelayOutcome(profile);
  const loss = fleetLossOutcome();
  const source = nearestStockSource(profile.partId, aircraft.base);
  const transferDone = !!partTransfer[aircraft.id];
  const approved = decisionFor(aircraft.id)?.state === 'approved';

  const [subOpen, setSubOpen] = useState(false);

  const scenarios: { id: ScenarioKind; label: string }[] = [
    { id: 'unavailable', label: 'Aircraft unavailable' },
    ...(profile.supportedScenarios.includes('partDelay')
      ? [{ id: 'partDelay' as ScenarioKind, label: 'Part delayed 3 days' }]
      : []),
    ...(profile.supportedScenarios.includes('fleetLoss')
      ? [{ id: 'fleetLoss' as ScenarioKind, label: 'Two more aircraft lost' }]
      : []),
  ];

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Mission Impact Simulator
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          What happens if {aircraft.id} becomes unavailable?
        </p>
      </div>

      {/* scenario picker */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={`h-7 px-2.5 rounded-md text-[10px] font-semibold transition-colors ${
              scenario === s.id
                ? 'bg-navy text-white'
                : 'bg-cloud text-slate-500 border border-slate-100 hover:border-navy/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* duration picker — unavailable scenario only */}
      {scenario === 'unavailable' ? (
        <div className="flex gap-1.5 mb-3">
          {(['24H', '48H', '7D'] as DurationKey[]).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`h-7 flex-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${
                duration === d
                  ? 'bg-navy text-white'
                  : 'bg-cloud text-slate-500 border border-slate-100 hover:border-navy/30'
              }`}
            >
              {DURATION_LABEL[d]}
            </button>
          ))}
        </div>
      ) : null}

      {/* ---------- simulated impact ---------- */}
      {scenario === 'unavailable' ? (
        <div className="rounded-lg border border-slate-100 p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Simulated Operational Impact
            </p>
            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${RISK_STYLE[outcome.riskAfter]}`}>
              {outcome.riskAfter}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Metric
              label="Fleet availability"
              before={`${FLEET_AVAILABILITY_CURRENT}%`}
              after={`${outcome.fleetAvailabilityAfter}%`}
              tone={outcome.fleetAvailabilityAfter >= FLEET_AVAILABILITY_CURRENT ? 'up' : 'down'}
            />
            <Metric
              label="Squadron readiness"
              before={`${SQUADRON_READINESS_CURRENT}%`}
              after={`${outcome.squadronReadinessAfter}%`}
              tone={outcome.squadronReadinessAfter >= SQUADRON_READINESS_CURRENT ? 'up' : 'down'}
            />
            <Metric label="Missions at risk" before={impact.missionsAtRisk} after={outcome.missionsAtRisk} tone="down" />
            <Metric label="Sorties affected" before={impact.sortiesAffected} after={outcome.sortiesAffected} tone="down" />
            <Metric label="Maintenance burden" before="0" after={`+1 aircraft`} />
            <Metric label="Crew impact" before="0" after={profile.crewImpact.replace(/^\d+\s/, '')} />
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
            <p className="flex items-start gap-1.5 text-[10px] text-slate-500">
              <Package size={10} className="text-slate-300 shrink-0 mt-0.5" />
              {profile.partsImpact}
            </p>
            <p className="flex items-start gap-1.5 text-[10px] text-slate-500">
              <Users size={10} className="text-slate-300 shrink-0 mt-0.5" />
              Assigned: {profile.crewAssigned} · {profile.crewImpact}
            </p>
            <p className="flex items-start gap-1.5 text-[10px] text-slate-500">
              <Clock size={10} className="text-slate-300 shrink-0 mt-0.5" />
              {impact.note}
            </p>
          </div>
        </div>
      ) : null}

      {/* ---------- part delay scenario ---------- */}
      {scenario === 'partDelay' ? (
        <div className="rounded-lg border border-warn/25 bg-warn/5 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2.5">
            What if {profile.partId} is delayed by 3 days?
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Metric label="Maintenance" before={`${delay.maintenanceBefore}h`} after={`${delay.maintenanceAfter}h`} tone="down" />
            <Metric label="Missions at risk" before={delay.missionsAtRiskBefore} after={delay.missionsAtRiskAfter} tone="down" />
            <Metric label="Fleet availability" before={`${FLEET_AVAILABILITY_CURRENT}%`} after={`${delay.fleetAvailabilityAfter}%`} tone="down" />
            <Metric label="Required part" before={profile.partId} after="delayed" />
          </div>
          <p className="mt-2.5 text-[10px] text-slate-500">
            Recommended action: {delay.recommendedAction}
          </p>
          <button
            onClick={() => source && requestTransfer(aircraft.id, profile.partId, source.base)}
            disabled={!source || transferDone}
            className={`mt-2 h-7 w-full rounded-md text-[10px] font-semibold transition-colors ${
              transferDone
                ? 'bg-ok/10 text-ok border border-ok/25'
                : source
                  ? 'bg-navy text-white hover:bg-navy-hover'
                  : 'bg-white text-slate-400 border border-slate-100 cursor-not-allowed'
            }`}
          >
            {transferDone
              ? `Transfer requested — ${source?.base}`
              : source
                ? `Request transfer from ${source.base}`
                : 'No inter-base stock'}
          </button>
        </div>
      ) : null}

      {/* ---------- fleet loss scenario ---------- */}
      {scenario === 'fleetLoss' ? (
        <div className="rounded-lg border border-bad/25 bg-bad/5 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2.5">
            What if two more aircraft become unavailable?
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Metric label="Additional aircraft" before={0} after={`+${loss.additionalAircraft}`} tone="down" />
            <Metric label="Missions at risk" before={impact.missionsAtRisk} after={impact.missionsAtRisk + loss.additionalMissionsAtRisk} tone="down" />
            <Metric label="Fleet availability" before={`${FLEET_AVAILABILITY_CURRENT}%`} after={`${loss.fleetAvailabilityAfter}%`} tone="down" />
            <Metric label="Squadron readiness" before={`${SQUADRON_READINESS_CURRENT}%`} after={`${loss.squadronReadinessAfter}%`} tone="down" />
          </div>
          {loss.belowThreshold ? (
            <p className="mt-2.5 flex items-center gap-1.5 rounded-md bg-bad/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-bad">
              <TriangleAlert size={11} /> Fleet below mission support threshold
            </p>
          ) : null}
          <p className="mt-2 text-[10px] text-slate-500">Recommended action: {loss.recommendedAction}</p>
        </div>
      ) : null}

      <p className="mt-2 text-[10px] text-slate-300">
        Simulated operational scenario — not an actual operational prediction.
      </p>

      {/* ---------- alternate aircraft ---------- */}
      {scenario === 'unavailable' && impact.sortiesAffected > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Recommended Alternate Aircraft
            </h4>
            {alternate ? (
              <button
                onClick={() => setAlternateId(null)}
                className="text-[10px] font-semibold text-slate-400 hover:text-navy transition-colors"
              >
                Clear selection
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            {alternates.map((a, i) => {
              const isSel = alternateId === a.aircraftId;
              const isTop = i === 0;
              return (
                <div
                  key={a.aircraftId}
                  className={`rounded-lg border p-3 transition-all ${
                    isSel ? 'border-navy bg-navy-soft/50 ring-1 ring-navy/20' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800">
                        {a.aircraftId}
                        <span className="font-medium text-slate-500"> — {a.name}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {isTop ? (
                          <span className="rounded-full bg-navy px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                            Recommended
                          </span>
                        ) : null}
                        {isSel ? (
                          <span className="flex items-center gap-0.5 rounded-full bg-ok px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                            <Check size={8} /> Selected
                          </span>
                        ) : null}
                        <span className="rounded-full border border-slate-200 bg-cloud px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                          {a.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setAlternateId(isSel ? null : a.aircraftId)}
                      disabled={approved}
                      className={`h-6 shrink-0 rounded-md px-2.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                        isSel
                          ? 'bg-ok text-white'
                          : approved
                            ? 'bg-cloud text-slate-300 cursor-not-allowed'
                            : 'bg-navy text-white hover:bg-navy-hover'
                      }`}
                    >
                      {isSel ? 'Selected' : 'Select'}
                    </button>
                  </div>

                  <dl className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                    {[
                      ['Compatibility', `${a.compatibility}%`],
                      ['Health', `${Math.round(a.health)}%`],
                      ['Suitability', a.missionSuitability],
                      ['Pilot', a.pilotAvailable ? 'YES' : 'NO'],
                      ['Location', a.location.replace('AF Stn ', '')],
                      ['Conflict', CONFLICT_LABEL[a.maintenanceConflict]],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-md bg-white/70 py-1.5">
                        <dt className="text-[9px] text-slate-400">{k}</dt>
                        <dd className="text-[10px] font-bold text-slate-700 mt-0.5">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {isTop ? (
                    <div className="mt-2 border-t border-slate-100 pt-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        Why this aircraft?
                      </p>
                      <ul className="mt-0.5 space-y-0.5">
                        {a.reasons.slice(0, 5).map((r) => (
                          <li key={r} className="text-[10px] text-slate-500 flex gap-1">
                            <span className="text-slate-300">—</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* ---------- simulated result ---------- */}
          {alternate ? (
            <div className="mt-3 rounded-lg border border-ok/25 bg-ok/5 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ok">
                <CheckCircle2 size={12} /> Simulated Result
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <Metric
                  label="Sorties affected"
                  before={impact.sortiesAffected}
                  after={outcome.sortiesAffected}
                  tone={outcome.sortiesAffected < impact.sortiesAffected ? 'up' : undefined}
                />
                <Metric
                  label="Fleet availability"
                  before={`${impact.fleetAvailabilityAfter}%`}
                  after={`${outcome.fleetAvailabilityAfter}%`}
                  tone={outcome.fleetAvailabilityAfter > impact.fleetAvailabilityAfter ? 'up' : undefined}
                />
                <Metric
                  label="Squadron readiness"
                  before={`${impact.squadronReadinessAfter}%`}
                  after={`${outcome.squadronReadinessAfter}%`}
                  tone={outcome.squadronReadinessAfter > impact.squadronReadinessAfter ? 'up' : undefined}
                />
                <Metric
                  label="Mission risk"
                  before={impact.overallRisk}
                  after={outcome.riskAfter}
                  tone={outcome.riskAfter === 'LOW' ? 'up' : undefined}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-600">{outcome.note}</p>

              <button
                onClick={() => setSubOpen(true)}
                disabled={approved}
                className={`mt-2.5 h-8 w-full rounded-md text-[11px] font-semibold transition-colors ${
                  approved
                    ? 'bg-ok/10 text-ok border border-ok/25 cursor-default'
                    : 'bg-navy text-white hover:bg-navy-hover'
                }`}
              >
                {approved ? 'Replacement approved' : `Assign ${alternate.aircraftId} as replacement`}
              </button>
            </div>
          ) : (
            <p className="mt-3 flex items-start gap-1.5 rounded-md bg-cloud px-2.5 py-2 text-[10px] text-slate-500">
              <AlertTriangle size={10} className="text-warn shrink-0 mt-0.5" />
              Select an alternate aircraft to model the substitution.
            </p>
          )}
        </div>
      ) : null}

      <SubstitutionModal
        open={subOpen}
        onClose={() => setSubOpen(false)}
        unavailableId={aircraft.id}
        unavailableName={aircraft.name}
        replacementId={alternate?.aircraftId ?? ''}
        replacementName={alternate?.name ?? ''}
        protectedSorties={impact.sortiesAffected - outcome.sortiesAffected}
        riskBefore={impact.overallRisk}
        riskAfter={outcome.riskAfter}
        onConfirm={() => {
          if (!alternate) return;
          approveSubstitution(
            aircraft.id,
            aircraft.name,
            alternate.aircraftId,
            alternate.name,
            impact.sortiesAffected - outcome.sortiesAffected
          );
          onOpenSubstitution?.();
        }}
      />
    </div>
  );
}