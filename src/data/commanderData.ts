import type { SensorMetric, SensorReading } from '@/data/types';
import { SENSOR_RANGES, isAnomalous } from '@/utils/sensorSimulator';

/* ============================================================
   Mission Readiness & Command Decision Center — mock data

   Everything here is SIMULATED for demonstration. Aircraft, crew
   and parts are reused from the existing mock sets; the featured
   command scenario, mission tasking and what-if projections are
   demo values pinned for the walkthrough.
   ============================================================ */

export type MissionRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type ScenarioId = 'ground' | 'continue' | 'transfer';
export type DecisionState = 'pending' | 'approved' | 'overridden';

/* ---------- featured command scenario ---------- */

/** The airframe the Commander is asked to decide on in the demo. */
export const FEATURED_DECISION_ID = 'AC-007';

/** Component the featured fault is attributed to (drives the evidence focus). */
export const FEATURED_COMPONENT = 'engine' as const;

export interface FeaturedDecision {
  aircraftId: string;
  issue: string;
  confidence: number;
  failureWindow: string;
  severity: 'Critical';
  partId: string;
  partName: string;
  sourceBase: string;
  engineersAvailable: number;
  repairHours: number;
}

export const DEMO_DECISION: FeaturedDecision = {
  aircraftId: FEATURED_DECISION_ID,
  issue: 'Engine vibration anomaly',
  confidence: 78,
  failureWindow: '8–14 hrs',
  severity: 'Critical',
  partId: 'P-214',
  partName: 'Bearing Assembly',
  sourceBase: 'Base B',
  engineersAvailable: 2,
  repairHours: 6,
};

/** Fleet availability before any Commander action — demo baseline. */
export const BASELINE_AVAILABILITY = 78;

export const RISK_TONE: Record<MissionRisk, string> = {
  LOW: 'bg-ok/10 text-ok border-ok/25',
  MEDIUM: 'bg-warn/10 text-warn border-warn/25',
  HIGH: 'bg-bad/10 text-bad border-bad/25',
};

/* ---------- mission tasking ---------- */

export interface Mission {
  id: string;
  name: string;
  aircraftId: string;
  startTime: string;
  duration: string;
  impact: MissionRisk;
  sorties: number;
}

export const MISSION_PLAN: Mission[] = [
  { id: 'MSN-4412', name: 'Combat Patrol', aircraftId: 'AC-007', startTime: '14:00', duration: '3 hrs', impact: 'HIGH', sorties: 1 },
  { id: 'MSN-4418', name: 'Reconnaissance', aircraftId: 'AC-003', startTime: '16:30', duration: '2 hrs', impact: 'MEDIUM', sorties: 1 },
  { id: 'MSN-4425', name: 'Border Patrol', aircraftId: 'AC-001', startTime: '06:00', duration: '4 hrs', impact: 'LOW', sorties: 2 },
  { id: 'MSN-4431', name: 'Air Superiority', aircraftId: 'AC-005', startTime: '18:45', duration: '2.5 hrs', impact: 'LOW', sorties: 2 },
];

export function missionFor(aircraftId: string): Mission | undefined {
  return MISSION_PLAN.find((m) => m.aircraftId === aircraftId);
}

/* ---------- part availability ---------- */

export interface PartNode {
  base: string;
  quantity: number;
}

export const PART_DISTRIBUTION: Record<string, PartNode[]> = {
  'P-214': [
    { base: 'Base A', quantity: 0 },
    { base: 'Base B', quantity: 1 },
  ],
  'HYD-2241': [
    { base: 'Base A', quantity: 0 },
    { base: 'Base B', quantity: 1 },
  ],
  'ENG-0912': [
    { base: 'Base A', quantity: 4 },
    { base: 'Base B', quantity: 0 },
  ],
};

export function partNodes(partId: string): PartNode[] {
  return PART_DISTRIBUTION[partId] ?? [];
}

/** Nearest base holding stock, excluding the aircraft's home base. */
export function nearestStockSource(partId: string, homeBase: string): PartNode | null {
  return partNodes(partId).find((n) => n.base !== homeBase && n.quantity > 0) ?? null;
}

export const SUPPLIER_ETA_DAYS: Record<string, number> = {
  'P-214': 4,
  'HYD-2241': 4,
  'ENG-0912': 21,
};

/** Simulated inter-base logistics leg time, in hours. */
export const TRANSFER_HOURS = 2.5;

/* ---------- evidence, derived from live telemetry ---------- */

export type EvidenceState = 'Normal' | 'Elevated' | 'Abnormal';

export interface EvidenceRow {
  metric: SensorMetric;
  label: string;
  value: number;
  unit: string;
  state: EvidenceState;
  focus: boolean;
}

/** Within 12% of the limit reads as elevated, beyond it as abnormal. */
export function buildEvidence(
  reading: SensorReading | undefined,
  focus: SensorMetric
): EvidenceRow[] {
  return (['engineTemp', 'vibration', 'oilPressure', 'fuelFlow'] as SensorMetric[]).map((m) => {
    const r = SENSOR_RANGES[m];
    const value = reading ? reading[m] : 0;
    let state: EvidenceState = 'Normal';
    if (reading) {
      if (isAnomalous(m, value)) state = 'Abnormal';
      else {
        const margin = r.higherIsBad
          ? (value - r.min) / Math.max(0.001, r.max - r.min)
          : (r.max - value) / Math.max(0.001, r.max - r.min);
        if (margin > 0.88) state = 'Elevated';
      }
    }
    return { metric: m, label: r.label, value, unit: r.unit, state, focus: m === focus };
  });
}

/* ---------- what-if options (simulated demo projections) ---------- */

export interface WhatIfOption {
  id: ScenarioId;
  title: string;
  /** projected fleet availability after taking this option */
  projectedPct: number;
  riskFrom: MissionRisk;
  riskTo: MissionRisk;
  repairHours: number;
  partId: string;
  logisticsHours?: number;
  transferFrom?: string;
  possibleAOG: boolean;
  summary: string;
}

export const WHAT_IF_OPTIONS: WhatIfOption[] = [
  {
    id: 'ground',
    title: 'Ground Aircraft',
    projectedPct: 81,
    riskFrom: 'HIGH',
    riskTo: 'LOW',
    repairHours: DEMO_DECISION.repairHours,
    partId: DEMO_DECISION.partId,
    possibleAOG: false,
    summary: 'Remove from service and inspect before the next sortie window.',
  },
  {
    id: 'continue',
    title: 'Keep Aircraft In Service',
    projectedPct: 75,
    riskFrom: 'MEDIUM',
    riskTo: 'HIGH',
    repairHours: 0,
    partId: DEMO_DECISION.partId,
    possibleAOG: true,
    summary: 'Fly as tasked. Risk of an unscheduled failure inside the mission window.',
  },
  {
    id: 'transfer',
    title: 'Transfer Spare',
    projectedPct: 89,
    riskFrom: 'MEDIUM',
    riskTo: 'LOW',
    repairHours: DEMO_DECISION.repairHours,
    partId: DEMO_DECISION.partId,
    logisticsHours: TRANSFER_HOURS,
    transferFrom: DEMO_DECISION.sourceBase,
    possibleAOG: false,
    summary: `Move ${DEMO_DECISION.partId} from ${DEMO_DECISION.sourceBase} and service on turn-around.`,
  },
];

export function optionFor(id: ScenarioId | null): WhatIfOption | null {
  return WHAT_IF_OPTIONS.find((o) => o.id === id) ?? null;
}

export const SCENARIO_LABEL: Record<ScenarioId, string> = {
  ground: 'GROUND AIRCRAFT',
  continue: 'KEEP IN SERVICE',
  transfer: 'TRANSFER SPARE',
};

/* ---------- fleet availability forecast ---------- */

export interface ForecastPoint {
  window: string;
  value: number;
}

export const AVAILABILITY_TARGET = 90;

/** Forecast is generated from the current figure so it stays self-consistent. */
export function buildForecast(currentPct: number): ForecastPoint[] {
  return [
    { window: 'NOW', value: currentPct },
    { window: '+6H', value: Math.max(0, currentPct - 3) },
    { window: '+12H', value: Math.max(0, currentPct - 5) },
    { window: '+24H', value: Math.max(0, currentPct - 8) },
  ];
}

/* ---------- command activity log ---------- */

export interface CommandLogEntry {
  id: string;
  time: string;
  ref: string;
  action: string;
  actor: string;
  tone: 'approved' | 'override' | 'transfer' | 'info';
}

export const INITIAL_COMMAND_LOG: CommandLogEntry[] = [
  { id: 'CL-003', time: '02:07', ref: 'AC-007', action: 'Grounding approved', actor: 'Commander', tone: 'approved' },
  { id: 'CL-002', time: '01:54', ref: 'P-214', action: 'Spare transfer requested', actor: 'Commander', tone: 'transfer' },
  { id: 'CL-001', time: '01:31', ref: 'AC-003', action: 'Maintenance scheduled', actor: 'Commander', tone: 'info' },
];

/* ---------- override ---------- */

export const OVERRIDE_REASONS = [
  'Mission Critical',
  'Alternative Aircraft Unavailable',
  'Operational Requirement',
  'Maintenance Deferment',
  'Other',
] as const;

export type OverrideReason = (typeof OVERRIDE_REASONS)[number];