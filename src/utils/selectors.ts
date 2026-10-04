import type { Aircraft, FaultPrediction, WorkOrder } from '@/data/types';
import { daysFromNow } from '@/utils/helpers';

/* ============================================================
   Shared derived-data selectors
   ============================================================ */

/** Operational + no active critical prediction */
export function isMissionReady(a: Aircraft, predictions: FaultPrediction[]): boolean {
  return (
    a.status === 'operational' &&
    !predictions.some((p) => p.aircraftId === a.id && p.severity === 'critical')
  );
}

export interface ProjectionRow {
  window: string;
  ready: number;
  note: string;
  tone: 'ok' | 'warn' | 'neutral';
}

export function readinessProjection(
  aircraft: Aircraft[],
  predictions: FaultPrediction[],
  workOrders: WorkOrder[]
): ProjectionRow[] {
  const now = aircraft.filter((a) => isMissionReady(a, predictions)).length;

  const inHrs = (h: number) =>
    aircraft.filter((a) => {
      if (isMissionReady(a, predictions)) return true;
      const wos = workOrders.filter(
        (w) => w.aircraftId === a.id && w.status !== 'completed' && new Date(w.dueBy).getTime() < Date.now() + h * 3600000
      );
      return a.status === 'maintenance' && wos.length > 0;
    }).length;

  const in7d = aircraft.filter(
    (a) => a.status !== 'grounded' && !(a.status === 'critical' && predictions.some((p) => p.aircraftId === a.id && p.severity === 'critical'))
  ).length;

  return [
    { window: 'Now', ready: now, note: 'Operational aircraft without critical predictions', tone: 'ok' },
    { window: 'In 24 hrs', ready: Math.max(now, Math.min(inHrs(24), now + 2)), note: '2 aircraft completing maintenance', tone: 'ok' },
    { window: 'In 48 hrs', ready: Math.max(now, Math.min(inHrs(48), now + 4)), note: 'Post-maintenance test flights', tone: 'warn' },
    { window: 'In 7 days', ready: Math.max(now, in7d), note: 'All scheduled maintenance complete', tone: 'ok' },
  ];
}

export function dueWindowLabel(dueBy: string): 'overdue' | 'today' | 'soon' | 'later' {
  const diff = new Date(dueBy).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 86400000) return 'today';
  if (diff < 3 * 86400000) return 'soon';
  return 'later';
}

export function next7DaysWork(workOrders: WorkOrder[]): WorkOrder[] {
  const cutoff = daysFromNow(7);
  return workOrders
    .filter((w) => w.status !== 'completed' && w.dueBy <= cutoff)
    .sort((a, b) => (a.dueBy > b.dueBy ? 1 : -1));
}
