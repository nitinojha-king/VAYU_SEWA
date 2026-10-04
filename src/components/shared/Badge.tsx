'use client';

import type { ReactNode } from 'react';
import type {
  AircraftStatus,
  Severity,
  Priority,
  WOStatus,
  ProcurementStatus,
} from '@/data/types';

/* ============================================================
   Vayu Sewa badge system — status colours only, nothing else
   ============================================================ */

export function BaseBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_LABELS: Record<AircraftStatus, string> = {
  operational: 'Operational',
  warning: 'Warning',
  critical: 'Critical',
  maintenance: 'Maintenance',
  grounded: 'Grounded',
};

const STATUS_STYLES: Record<AircraftStatus, string> = {
  operational: 'bg-ok/10 text-ok border-ok/25',
  warning: 'bg-warn/10 text-warn border-warn/25',
  critical: 'bg-bad/10 text-bad border-bad/25',
  maintenance: 'bg-navy-soft text-navy border-navy/20',
  grounded: 'bg-bad/5 text-bad border-bad/50',
};

export function StatusBadge({ status }: { status: AircraftStatus }) {
  return <BaseBadge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</BaseBadge>;
}

export function TypeBadge({ type }: { type: string }) {
  return <BaseBadge className="bg-cloud text-slate-500 border-transparent">{type}</BaseBadge>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = severity === 'critical' ? 'bg-bad/10 text-bad border-bad/25' : 'bg-warn/10 text-warn border-warn/25';
  return (
    <BaseBadge className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${severity === 'critical' ? 'bg-bad' : 'bg-warn'}`} />
      {severity === 'critical' ? 'Critical' : 'Warning'}
    </BaseBadge>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  critical: 'bg-bad/10 text-bad border-bad/25',
  high: 'bg-warn/10 text-warn border-warn/25',
  medium: 'bg-navy-soft text-navy border-navy/20',
  low: 'bg-cloud text-slate-500 border-transparent',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <BaseBadge className={PRIORITY_STYLES[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </BaseBadge>
  );
}

const WO_STYLES: Record<WOStatus, string> = {
  pending: 'bg-warn/10 text-warn border-warn/25',
  'in-progress': 'bg-navy-soft text-navy border-navy/20',
  completed: 'bg-ok/10 text-ok border-ok/25',
};

const WO_LABELS: Record<WOStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

export function WorkOrderStatusBadge({ status }: { status: WOStatus }) {
  return <BaseBadge className={WO_STYLES[status]}>{WO_LABELS[status]}</BaseBadge>;
}

export type StockStatusT = 'in-stock' | 'low-stock' | 'out-of-stock';

const STOCK_STYLES: Record<StockStatusT, string> = {
  'in-stock': 'bg-ok/10 text-ok border-ok/25',
  'low-stock': 'bg-warn/10 text-warn border-warn/25',
  'out-of-stock': 'bg-bad/10 text-bad border-bad/25',
};

const STOCK_LABELS: Record<StockStatusT, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

export function StockBadge({ status }: { status: StockStatusT }) {
  return <BaseBadge className={STOCK_STYLES[status]}>{STOCK_LABELS[status]}</BaseBadge>;
}

const PROC_LABELS: Record<ProcurementStatus, string> = {
  raised: 'Raised',
  approved: 'Approved',
  ordered: 'Ordered',
  'in-transit': 'In Transit',
  received: 'Received',
};

export function ProcurementStatusBadge({ status }: { status: ProcurementStatus }) {
  const cls =
    status === 'received'
      ? 'bg-ok/10 text-ok border-ok/25'
      : status === 'raised'
        ? 'bg-warn/10 text-warn border-warn/25'
        : 'bg-navy-soft text-navy border-navy/20';
  return <BaseBadge className={cls}>{PROC_LABELS[status]}</BaseBadge>;
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <BaseBadge className="bg-navy-soft text-navy border-navy/20">
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </BaseBadge>
  );
}
