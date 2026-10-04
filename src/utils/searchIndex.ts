import Fuse from 'fuse.js';
import type { Aircraft, FaultPrediction, WorkOrder, SparePart } from '@/data/types';

/* ============================================================
   Global search index (Fuse.js) — Ctrl+K across the platform
   ============================================================ */

export interface SearchItem {
  type: 'aircraft' | 'prediction' | 'workorder' | 'part';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  route: string;
}

export interface SearchDataset {
  aircraft: Aircraft[];
  predictions: FaultPrediction[];
  workOrders: WorkOrder[];
  parts: SparePart[];
}

export function buildSearchItems(d: SearchDataset): SearchItem[] {
  const items: SearchItem[] = [];

  d.aircraft.forEach((a) => {
    items.push({
      type: 'aircraft',
      id: a.id,
      title: `${a.id} — ${a.name}`,
      subtitle: `${a.type} · Health ${Math.round(a.healthScore)}%`,
      status: a.status,
      route: '/engineer/aircraft/' + a.id,
    });
  });

  d.predictions.forEach((p) => {
    items.push({
      type: 'prediction',
      id: p.id,
      title: `${p.aircraftId} — ${p.component}`,
      subtitle: `${p.confidence}% confidence · ~${p.estimatedFailureHours}h to failure`,
      status: p.severity,
      route: '/engineer/predictions',
    });
  });

  d.workOrders.forEach((w) => {
    items.push({
      type: 'workorder',
      id: w.id,
      title: `${w.id} — ${w.task}`,
      subtitle: `${w.aircraftId} · ${w.assignedCrew}`,
      status: w.status,
      route: '/engineer/workorders',
    });
  });

  d.parts.forEach((p) => {
    items.push({
      type: 'part',
      id: p.partId,
      title: `${p.partId} — ${p.name}`,
      subtitle: `${p.category} · ${p.quantity} in stock`,
      status:
        p.quantity === 0 ? 'out-of-stock' : p.quantity <= p.minimumRequired ? 'low-stock' : 'in-stock',
      route: '/logistics/parts',
    });
  });

  return items;
}

export function createFuse(items: SearchItem[]): Fuse<SearchItem> {
  return new Fuse(items, {
    keys: [
      { name: 'title', weight: 0.45 },
      { name: 'subtitle', weight: 0.2 },
      { name: 'id', weight: 0.25 },
      { name: 'status', weight: 0.1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
  });
}

export const TYPE_LABELS: Record<SearchItem['type'], string> = {
  aircraft: 'Aircraft',
  prediction: 'Fault Predictions',
  workorder: 'Work Orders',
  part: 'Spare Parts',
};

export const TYPE_ICONS: Record<SearchItem['type'], string> = {
  aircraft: 'plane',
  prediction: 'alert',
  workorder: 'wrench',
  part: 'package',
};
