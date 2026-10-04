'use client';

import { Activity, Gauge, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Aircraft } from '@/data/types';
import { StatusBadge, TypeBadge } from '@/components/shared/Badge';
import ProgressBar from '@/components/shared/ProgressBar';
import { healthColor } from '@/utils/healthCalculator';

/* ============================================================
   Aircraft card — used on status maps & health grids
   ============================================================ */

export default function AircraftCard({
  aircraft,
  onClick,
  showHealthNumber = false,
}: {
  aircraft: Aircraft;
  onClick: () => void;
  showHealthNumber?: boolean;
}) {
  const border =
    aircraft.status === 'critical' || aircraft.status === 'grounded'
      ? 'border-l-bad'
      : aircraft.status === 'warning'
        ? 'border-l-warn'
        : 'border-l-transparent';

  return (
    <button
      onClick={onClick}
      className={`ag-card text-left p-4 border-l-[3px] ${border} hover:border-navy/30 hover:shadow-md transition-all w-full`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {aircraft.id} <span className="font-medium text-slate-500">· {aircraft.name}</span>
          </p>
          <div className="mt-1.5">
            <TypeBadge type={aircraft.type} />
          </div>
        </div>
        <StatusBadge status={aircraft.status} />
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex-1">
          <ProgressBar value={aircraft.healthScore} color={healthColor(aircraft.healthScore)} height={5} />
        </div>
        {showHealthNumber ? (
          <span className="text-sm font-bold tabular-nums" style={{ color: healthColor(aircraft.healthScore) }}>
            {Math.round(aircraft.healthScore)}%
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Gauge size={11} /> {aircraft.flightHours.toLocaleString('en-IN')} flt hrs
        </span>
        <span className="flex items-center gap-1 text-navy opacity-0 group-hover:opacity-0">
          <Activity size={11} /> {Math.round(aircraft.engineCycles)} cycles
        </span>
      </div>
    </button>
  );
}

/* Small link chip reused inside slide-overs */
export function ViewDetailsLink({ aircraftId }: { aircraftId: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/engineer/aircraft/${aircraftId}`)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-navy-hover transition-colors"
    >
      View Full Details <ArrowRight size={13} />
    </button>
  );
}
