import type { Aircraft, ComponentKey } from '@/data/types';
import { missionFor, MISSION_PLAN, type Mission } from './commanderData';

/* ============================================================
   Mission Impact Simulator — fleet-wide scenario data.

   ONE data shape drives every aircraft. Detailed profiles exist
   for the demo airframes; every other aircraft gets a conservative
   fallback derived from its own health, status and tasking, so the
   simulator never breaks and never needs a bespoke component.

   All figures are SIMULATED demo values.
   ============================================================ */

export type ImpactRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DurationKey = '24H' | '48H' | '7D';
export type ScenarioKind = 'unavailable' | 'partDelay' | 'fleetLoss';
export type Suitability = 'HIGH' | 'MEDIUM' | 'LOW';
export type Conflict = 'NONE' | 'SCHEDULED' | 'ACTIVE';

export const DURATION_LABEL: Record<DurationKey, string> = {
  '24H': '24 Hours',
  '48H': '48 Hours',
  '7D': '7 Days',
};

export interface DurationImpact {
  duration: DurationKey;
  missionsAtRisk: number;
  sortiesAffected: number;
  fleetAvailabilityAfter: number;
  squadronReadinessAfter: number;
  overallRisk: ImpactRisk;
  note: string;
}

export interface AlternateCandidate {
  aircraftId: string;
  name: string;
  type: Aircraft['type'];
  compatibility: number;
  missionSuitability: Suitability;
  pilotAvailable: boolean;
  maintenanceConflict: Conflict;
  location: string;
  sameBase: boolean;
  health: number;
  reasons: string[];
  score: number;
}

export interface MissionImpactProfile {
  aircraftId: string;
  currentIssue: string;
  componentKey: ComponentKey;
  risk: ImpactRisk;
  confidence: number;
  failureWindowLabel: string;
  failureWindowHours: number;

  affectedMissionIds: string[];
  missionsAtRisk: number;
  sortiesAffected: number;

  squadronReadinessCurrent: number;
  squadronReadinessAfter: number;
  fleetAvailabilityCurrent: number;
  fleetAvailabilityAfter: number;

  partId: string;
  partName: string;
  partsImpact: string;
  crewAssigned: string;
  crewImpact: string;
  repairHours: number;

  supportedScenarios: ScenarioKind[];
  durations: DurationImpact[];
  recommendedAlternates: string[];
  summary: string;
  /** true when the profile was generated rather than hand-authored */
  generated: boolean;
}

/* ---------- fleet-wide baselines ---------- */

export const FLEET_AVAILABILITY_CURRENT = 78;
export const SQUADRON_READINESS_CURRENT = 84;

/* ---------- detailed demo profiles ---------- */

type ProfileSeed = Omit<
  MissionImpactProfile,
  'durations' | 'generated' | 'fleetAvailabilityCurrent' | 'squadronReadinessCurrent'
>;

const SEEDS: ProfileSeed[] = [
  {
    aircraftId: 'AC-012',
    currentIssue: 'Engine fuel nozzle failure',
    componentKey: 'engine',
    risk: 'HIGH',
    confidence: 91,
    failureWindowLabel: '9 hrs',
    failureWindowHours: 9,
    affectedMissionIds: ['MSN-4412', 'MSN-4437', 'MSN-4418'],
    missionsAtRisk: 3,
    sortiesAffected: 3,
    squadronReadinessAfter: 73,
    fleetAvailabilityAfter: 72,
    partId: 'FUE-1102',
    partName: 'Fuel Nozzle Set',
    partsImpact: 'Fuel nozzle set short by 2',
    crewAssigned: 'Cpl. R. Nair',
    crewImpact: '1 reassignment',
    repairHours: 9,
    supportedScenarios: ['unavailable', 'partDelay', 'fleetLoss'],
    recommendedAlternates: ['AC-004', 'AC-011', 'AC-002'],
    summary:
      'Three sorties depend on AC-012 within the window. Engine fuel nozzle degradation is the highest-confidence fault in the fleet.',
  },
  {
    aircraftId: 'AC-007',
    currentIssue: 'Engine vibration anomaly',
    componentKey: 'engine',
    risk: 'HIGH',
    confidence: 78,
    failureWindowLabel: '8–14 hrs',
    failureWindowHours: 11,
    affectedMissionIds: ['MSN-4412'],
    missionsAtRisk: 1,
    sortiesAffected: 1,
    squadronReadinessAfter: 78,
    fleetAvailabilityAfter: 76,
    partId: 'P-214',
    partName: 'Bearing Assembly',
    partsImpact: 'Bearing assembly not held at current base',
    crewAssigned: 'Sqn Ldr. P. Sharma',
    crewImpact: '2 qualified engineers available',
    repairHours: 6,
    supportedScenarios: ['unavailable', 'partDelay', 'fleetLoss'],
    recommendedAlternates: ['AC-011', 'AC-006'],
    summary:
      'One combat patrol sortie depends on AC-007. Vibration anomaly with a bearing assembly not held locally.',
  },
  {
    aircraftId: 'AC-003',
    currentIssue: 'Hydraulic pressure degradation',
    componentKey: 'hydraulic',
    risk: 'MEDIUM',
    confidence: 72,
    failureWindowLabel: '22 hrs',
    failureWindowHours: 22,
    affectedMissionIds: ['MSN-4418'],
    missionsAtRisk: 1,
    sortiesAffected: 1,
    squadronReadinessAfter: 80,
    fleetAvailabilityAfter: 75,
    partId: 'HYD-2241',
    partName: 'Hydraulic Pump Seal',
    partsImpact: 'Hydraulic pump seal stock at zero',
    crewAssigned: 'Tech Sgt. Kumar',
    crewImpact: '1 reassignment',
    repairHours: 6,
    supportedScenarios: ['unavailable', 'partDelay'],
    recommendedAlternates: ['AC-004', 'AC-011'],
    summary:
      'Hydraulic trend is degrading but remains inside the flight window. One reconnaissance sortie at risk.',
  },
  {
    aircraftId: 'AC-016',
    currentIssue: 'Rotor head vibration — hard safety hold',
    componentKey: 'engine',
    risk: 'CRITICAL',
    confidence: 88,
    failureWindowLabel: '4 hrs',
    failureWindowHours: 4,
    affectedMissionIds: [],
    missionsAtRisk: 0,
    sortiesAffected: 0,
    squadronReadinessAfter: 82,
    fleetAvailabilityAfter: 74,
    partId: 'LGA-0450',
    partName: 'Gear Actuator Assembly',
    partsImpact: 'Rotor head parts on back-order',
    crewAssigned: 'Sgt. A. Patel',
    crewImpact: '2 reassignments',
    repairHours: 12,
    supportedScenarios: ['unavailable', 'partDelay', 'fleetLoss'],
    recommendedAlternates: ['AC-017', 'AC-015'],
    summary:
      'Already on safety hold. Loss does not degrade readiness further, but it removes the squadron attack helicopter.',
  },
  {
    aircraftId: 'AC-002',
    currentIssue: 'Avionics bus fault',
    componentKey: 'avionics',
    risk: 'MEDIUM',
    confidence: 69,
    failureWindowLabel: '30 hrs',
    failureWindowHours: 30,
    affectedMissionIds: [],
    missionsAtRisk: 0,
    sortiesAffected: 0,
    squadronReadinessAfter: 82,
    fleetAvailabilityAfter: 77,
    partId: 'AVN-0331',
    partName: 'Avionics Control Unit',
    partsImpact: 'Avionics control unit in stock',
    crewAssigned: 'Cpl. D. Singh',
    crewImpact: 'No reassignment required',
    repairHours: 3,
    supportedScenarios: ['unavailable', 'fleetLoss'],
    recommendedAlternates: ['AC-008', 'AC-004'],
    summary:
      'Intermittent avionics bus fault with no mission tasking in the window. Low operational urgency.',
  },
  {
    aircraftId: 'AC-005',
    currentIssue: 'Engine trend above fleet baseline',
    componentKey: 'engine',
    risk: 'MEDIUM',
    confidence: 64,
    failureWindowLabel: '40 hrs',
    failureWindowHours: 40,
    affectedMissionIds: ['MSN-4431'],
    missionsAtRisk: 1,
    sortiesAffected: 2,
    squadronReadinessAfter: 81,
    fleetAvailabilityAfter: 76,
    partId: 'ENG-0912',
    partName: 'Compressor Blade Set',
    partsImpact: 'Compressor blade set in stock',
    crewAssigned: 'Cpl. V. Iyer',
    crewImpact: '1 reassignment',
    repairHours: 9,
    supportedScenarios: ['unavailable', 'partDelay'],
    recommendedAlternates: ['AC-001', 'AC-004'],
    summary:
      'Engine performance trending below fleet mean. Two air-superiority sorties at risk if deferred.',
  },
];

/* ---------- duration scaling ---------- */

/** Degradation multiplier per duration window, tuned for demo realism. */
const SCALE: Record<DurationKey, number> = { '24H': 0.34, '48H': 0.72, '7D': 1.35 };

function buildDurations(seed: ProfileSeed): DurationImpact[] {
  const base = seed.missionsAtRisk;
  const peak = base <= 0 ? 1 : base;
  const riskOrder: ImpactRisk[] = ['MEDIUM', 'HIGH', 'CRITICAL'];

  return (['24H', '48H', '7D'] as DurationKey[]).map((duration, i) => {
    const s = SCALE[duration];
    const missionsAtRisk = Math.max(0, Math.round(peak * s));
    const sortiesAffected = Math.max(0, Math.round(seed.sortiesAffected * s));
    const availDrop = Math.round(FLEET_AVAILABILITY_CURRENT - seed.fleetAvailabilityAfter);
    const availAfter =
      FLEET_AVAILABILITY_CURRENT - Math.round(availDrop * s) - (missionsAtRisk === 0 ? 0 : 0);
    const riskIdx = base === 0 ? 0 : Math.min(2, Math.round(s * 1.6) - 1 + (seed.risk === 'CRITICAL' ? 1 : 0));
    return {
      duration,
      missionsAtRisk,
      sortiesAffected,
      fleetAvailabilityAfter: Math.max(0, availAfter),
      squadronReadinessAfter: Math.max(
        0,
        SQUADRON_READINESS_CURRENT - Math.round((SQUADRON_READINESS_CURRENT - seed.squadronReadinessAfter) * s)
      ),
      overallRisk: missionsAtRisk === 0 && base === 0 ? 'LOW' : riskOrder[Math.max(0, Math.min(2, riskIdx))],
      note:
        duration === '24H'
          ? 'Absorbed inside the existing maintenance window.'
          : duration === '48H'
            ? 'Exceeds the current sortie cycle — tasking pressure builds.'
            : 'Sustained loss — reserve aircraft and re-tasking required.',
    };
  });
}

/* ---------- fallback generation ---------- */

const GENERIC_ISSUES: Record<ComponentKey, string> = {
  engine: 'Component health degradation — engine',
  hydraulic: 'Component health degradation — hydraulic',
  avionics: 'Component health degradation — avionics',
  landingGear: 'Component health degradation — landing gear',
  fuelSystem: 'Component health degradation — fuel system',
};

const GENERIC_PARTS: Record<ComponentKey, [string, string]> = {
  engine: ['ENG-0912', 'Compressor Blade Set'],
  hydraulic: ['HYD-2241', 'Hydraulic Pump Seal'],
  avionics: ['AVN-0331', 'Avionics Control Unit'],
  landingGear: ['LGA-0450', 'Gear Actuator Assembly'],
  fuelSystem: ['FUE-1102', 'Fuel Nozzle Set'],
};

function weakestOf(a: Aircraft): ComponentKey {
  return (Object.entries(a.components) as [ComponentKey, number][]).reduce((lo, e) =>
    e[1] < lo[1] ? e : lo
  )[0];
}

function riskFromHealth(health: number, status: Aircraft['status']): ImpactRisk {
  if (status === 'grounded') return 'CRITICAL';
  if (status === 'critical' || health < 50) return 'CRITICAL';
  if (status === 'maintenance' || health < 65) return 'HIGH';
  if (status === 'warning' || health < 78) return 'MEDIUM';
  return 'LOW';
}

/** Conservative demo profile derived from the aircraft's own live data. */
export function buildFallbackProfile(aircraft: Aircraft): MissionImpactProfile {
  const weakest = weakestOf(aircraft);
  const mission = missionFor(aircraft.id);
  const risk = riskFromHealth(aircraft.healthScore, aircraft.status);
  const [partId, partName] = GENERIC_PARTS[weakest];

  const baseSorties = mission ? mission.sorties : 0;
  const baseMissions = mission ? 1 : 0;
  const penalty = risk === 'CRITICAL' ? 12 : risk === 'HIGH' ? 8 : risk === 'MEDIUM' ? 5 : 3;

  const seed: ProfileSeed = {
    aircraftId: aircraft.id,
    currentIssue: GENERIC_ISSUES[weakest],
    componentKey: weakest,
    risk,
    confidence: Math.max(48, Math.min(92, Math.round(100 - aircraft.healthScore * 0.7 + 20))),
    failureWindowLabel: `${Math.max(6, Math.round((100 - aircraft.healthScore) * 0.8))} hrs`,
    failureWindowHours: Math.max(6, Math.round((100 - aircraft.healthScore) * 0.8)),
    affectedMissionIds: mission ? [mission.id] : [],
    missionsAtRisk: baseMissions,
    sortiesAffected: baseSorties,
    squadronReadinessAfter: Math.max(0, SQUADRON_READINESS_CURRENT - penalty),
    fleetAvailabilityAfter: Math.max(0, FLEET_AVAILABILITY_CURRENT - penalty),
    partId,
    partName,
    partsImpact: `${partName} availability to be confirmed`,
    crewAssigned: 'Unassigned',
    crewImpact: baseSorties > 0 ? '1 reassignment' : 'No crew impact',
    repairHours: weakest === 'engine' ? 9 : weakest === 'landingGear' ? 7 : 5,
    supportedScenarios:
      baseMissions > 0 ? ['unavailable', 'partDelay', 'fleetLoss'] : ['unavailable', 'fleetLoss'],
    recommendedAlternates: [],
    summary:
      baseMissions > 0
        ? `Generated scenario for ${aircraft.id}. One assigned sortie depends on this airframe.`
        : `Generated scenario for ${aircraft.id}. No mission tasking in the current window.`,
  };

  return {
    ...seed,
    durations: buildDurations(seed),
    fleetAvailabilityCurrent: FLEET_AVAILABILITY_CURRENT,
    squadronReadinessCurrent: SQUADRON_READINESS_CURRENT,
    generated: true,
  };
}

/* ---------- public lookup ---------- */

export function getMissionImpactProfile(aircraft: Aircraft): MissionImpactProfile {
  const seed = SEEDS.find((s) => s.aircraftId === aircraft.id);
  if (!seed) return buildFallbackProfile(aircraft);
  return {
    ...seed,
    durations: buildDurations(seed),
    fleetAvailabilityCurrent: FLEET_AVAILABILITY_CURRENT,
    squadronReadinessCurrent: SQUADRON_READINESS_CURRENT,
    generated: false,
  };
}

export function impactFor(profile: MissionImpactProfile, duration: DurationKey): DurationImpact {
  return profile.durations.find((d) => d.duration === duration) ?? profile.durations[1];
}

/* ---------- alternate aircraft scoring ---------- */

const CONFLICT_PENALTY: Record<Conflict, number> = { NONE: 0, SCHEDULED: 12, ACTIVE: 30 };

function suitabilityFor(candidate: Aircraft, original: Aircraft): Suitability {
  if (candidate.type === original.type) return 'HIGH';
  if (candidate.type === 'Transport' || original.type === 'Transport') return 'MEDIUM';
  return 'LOW';
}

/**
 * Demo scoring only — health, suitability, crew, location and
 * maintenance conflict. Not a real military assignment model.
 */
export function scoreAlternate(
  candidate: Aircraft,
  original: Aircraft,
  originalBase: string
): AlternateCandidate {
  const suitability = suitabilityFor(candidate, original);
  const health = candidate.healthScore;

  const conflict: Conflict =
    candidate.status === 'grounded'
      ? 'ACTIVE'
      : candidate.status === 'maintenance'
        ? 'SCHEDULED'
        : 'NONE';

  const pilotAvailable = candidate.status === 'operational' || candidate.status === 'warning';
  const sameBase = candidate.base === originalBase;

  const compatibility = Math.max(
    5,
    Math.min(
      99,
      Math.round(
        health * 0.4 +
          (suitability === 'HIGH' ? 96 : suitability === 'MEDIUM' ? 74 : 52) * 0.25 +
          (pilotAvailable ? 100 : 0) * 0.15 +
          (sameBase ? 100 : 55) * 0.1 +
          (candidate.type === original.type ? 100 : 60) * 0.1 -
          CONFLICT_PENALTY[conflict] * 0.5
      )
    )
  );

  const score = Math.max(
    0,
    compatibility - CONFLICT_PENALTY[conflict] + (sameBase ? 4 : 0) + (pilotAvailable ? 6 : 0)
  );

  const reasons: string[] = [];
  if (suitability === 'HIGH') reasons.push('Mission compatible');
  else if (suitability === 'MEDIUM') reasons.push('Partial mission compatibility');
  if (health >= 80) reasons.push(`High health score (${Math.round(health)}%)`);
  if (pilotAvailable) reasons.push('Pilot available');
  else reasons.push('No pilot available');
  if (conflict === 'NONE') reasons.push('No maintenance conflict');
  else reasons.push(`${conflict === 'ACTIVE' ? 'Grounded' : 'Scheduled'} maintenance`);
  if (sameBase) reasons.push('Same-base availability');
  reasons.push(suitability === 'HIGH' ? 'Lowest mission disruption' : 'Higher mission disruption');

  return {
    aircraftId: candidate.id,
    name: candidate.name,
    type: candidate.type,
    compatibility,
    missionSuitability: suitability,
    pilotAvailable,
    maintenanceConflict: conflict,
    location: candidate.base,
    sameBase,
    health,
    reasons,
    score: Math.round(score),
  };
}

/** Top alternates for the selected aircraft, already ranked. */
export function getAlternateAircraft(
  selected: Aircraft,
  fleet: Aircraft[],
  limit = 3
): AlternateCandidate[] {
  return fleet
    .filter((a) => a.id !== selected.id)
    .map((a) => scoreAlternate(a, selected, selected.base))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

/* ---------- outcome with a replacement applied ---------- */

export interface SubstitutedOutcome {
  sortiesAffected: number;
  missionsAtRisk: number;
  fleetAvailabilityAfter: number;
  squadronReadinessAfter: number;
  riskAfter: ImpactRisk;
  note: string;
}

/**
 * What the fleet looks like once an alternate covers the tasking.
 * Alternates rated HIGH recover every sortie; lower ratings leave
 * residual exposure, which is the point of the comparison.
 */
export function outcomeWithAlternate(
  profile: MissionImpactProfile,
  impact: DurationImpact,
  alternate: AlternateCandidate | null
): SubstitutedOutcome {
  if (!alternate) {
    return {
      sortiesAffected: impact.sortiesAffected,
      missionsAtRisk: impact.missionsAtRisk,
      fleetAvailabilityAfter: impact.fleetAvailabilityAfter,
      squadronReadinessAfter: impact.squadronReadinessAfter,
      riskAfter: impact.overallRisk,
      note: 'No replacement assigned — the full impact above applies.',
    };
  }

  const coverage =
    alternate.missionSuitability === 'HIGH'
      ? 1
      : alternate.missionSuitability === 'MEDIUM'
        ? 0.6
        : 0.25;

  const sortiesAffected = Math.round(impact.sortiesAffected * (1 - coverage));
  const missionsAtRisk = Math.round(impact.missionsAtRisk * (1 - coverage));
  const recovered = FLEET_AVAILABILITY_CURRENT - impact.fleetAvailabilityAfter;
  const bonus = alternate.sameBase ? 3 : 1;

  return {
    sortiesAffected,
    missionsAtRisk,
    fleetAvailabilityAfter: Math.min(
      100,
      Math.max(impact.fleetAvailabilityAfter, FLEET_AVAILABILITY_CURRENT + Math.round(recovered * coverage) + bonus)
    ),
    squadronReadinessAfter: Math.min(
      100,
      Math.max(impact.squadronReadinessAfter, SQUADRON_READINESS_CURRENT + Math.round((SQUADRON_READINESS_CURRENT - impact.squadronReadinessAfter) * coverage) + bonus)
    ),
    riskAfter: sortiesAffected === 0 ? 'LOW' : impact.overallRisk,
    note:
      sortiesAffected === 0
        ? `${alternate.aircraftId} protects all ${impact.sortiesAffected} affected sorties with minimal secondary impact.`
        : `${alternate.aircraftId} covers ${Math.round(coverage * 100)}% of the tasking — ${sortiesAffected} sortie(s) still exposed.`,
  };
}

/* ---------- auxiliary scenarios ---------- */

export interface PartDelayOutcome {
  maintenanceBefore: number;
  maintenanceAfter: number;
  missionsAtRiskBefore: number;
  missionsAtRiskAfter: number;
  fleetAvailabilityAfter: number;
  recommendedAction: string;
}

export function partDelayOutcome(profile: MissionImpactProfile): PartDelayOutcome {
  return {
    maintenanceBefore: profile.repairHours,
    maintenanceAfter: profile.repairHours * 12,
    missionsAtRiskBefore: profile.missionsAtRisk,
    missionsAtRiskAfter: profile.missionsAtRisk + 3,
    fleetAvailabilityAfter: Math.max(0, FLEET_AVAILABILITY_CURRENT - 4 - profile.missionsAtRisk),
    recommendedAction: 'Transfer part from the nearest holding base.',
  };
}

export interface FleetLossOutcome {
  additionalAircraft: number;
  additionalMissionsAtRisk: number;
  fleetAvailabilityAfter: number;
  squadronReadinessAfter: number;
  belowThreshold: boolean;
  recommendedAction: string;
}

export function fleetLossOutcome(): FleetLossOutcome {
  return {
    additionalAircraft: 2,
    additionalMissionsAtRisk: 4,
    fleetAvailabilityAfter: 68,
    squadronReadinessAfter: 69,
    belowThreshold: true,
    recommendedAction: 'Activate reserve aircraft and re-task low-priority sorties.',
  };
}

/* ---------- priority queue ordering ---------- */

const RISK_RANK: Record<ImpactRisk, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export interface PriorityEntry {
  aircraft: Aircraft;
  profile: MissionImpactProfile;
  rank: number;
}

/**
 * Most operationally urgent aircraft first — drives the Commander priority queue.
 * Mission exposure leads the ranking: an airframe with an assigned sortie is
 * more urgent than a worse-health airframe with nothing tasked, because that is
 * what actually costs missions.
 */
export function buildPriorityQueue(fleet: Aircraft[], limit = 5): PriorityEntry[] {
  return fleet
    .map((a) => ({ aircraft: a, profile: getMissionImpactProfile(a) }))
    .filter((e) => e.profile.risk !== 'LOW')
    .sort((x, y) => {
      const xTasked = x.profile.sortiesAffected > 0 ? 0 : 1;
      const yTasked = y.profile.sortiesAffected > 0 ? 0 : 1;
      if (xTasked !== yTasked) return xTasked - yTasked;
      const r = RISK_RANK[x.profile.risk] - RISK_RANK[y.profile.risk];
      if (r !== 0) return r;
      const m = y.profile.sortiesAffected - x.profile.sortiesAffected;
      if (m !== 0) return m;
      return x.profile.failureWindowHours - y.profile.failureWindowHours;
    })
    .slice(0, limit)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export function allMissions(): Mission[] {
  return MISSION_PLAN;
}