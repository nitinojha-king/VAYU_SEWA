'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Aircraft, ComponentKey, FaultPrediction } from '@/data/types';
import SlideOver from '@/components/shared/SlideOver';
import AircraftHealthMap from '@/components/shared/AircraftHealthMap';
import { StatusBadge, TypeBadge, SeverityBadge } from '@/components/shared/Badge';
import ProgressBar from '@/components/shared/ProgressBar';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import {
  healthColor,
  COMPONENT_LABELS,
  fleetAverageHealth,
} from '@/utils/healthCalculator';
import { fmtDate, hoursToHuman } from '@/utils/helpers';
import { SENSOR_RANGES } from '@/utils/sensorSimulator';

/* ============================================================
   Aircraft quick-summary slide-over (commander view)
   ============================================================ */

export default function AircraftSlideOver({
  aircraft,
  onClose,
}: {
  aircraft: Aircraft | null;
  onClose: () => void;
}) {
  const { latest, aircraft: fleet } = useSensors();
  const { predictions } = useData();
  const navigate = useNavigate();

  /* zone click → flash the matching component row for 2s */
  const [flashKey, setFlashKey] = useState<ComponentKey | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowsRef = useRef<HTMLDivElement | null>(null);

  const handleZoneSelect = useCallback((key: ComponentKey) => {
    setFlashKey(key);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashKey(null), 2000);
    rowsRef.current
      ?.querySelector<HTMLElement>(`[data-comp="${key}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  const fleetAvg = fleetAverageHealth(fleet);

  if (!aircraft) return null;
  const reading = latest[aircraft.id];
  const prediction = predictions
    .filter((p) => p.aircraftId === aircraft.id)
    .sort((a, b) => a.estimatedFailureHours - b.estimatedFailureHours)[0];

  return (
    <SlideOver
      open={!!aircraft}
      onClose={onClose}
      title={`${aircraft.id} — ${aircraft.name}`}
      subtitle={`${aircraft.type} · ${aircraft.squadron} · ${aircraft.base}`}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <StatusBadge status={aircraft.status} />
          <TypeBadge type={aircraft.type} />
        </div>

        {/* health */}
        <div className="rounded-lg border border-slate-100 p-4">
          <div className="flex items-end justify-between">
            <p className="text-xs font-medium text-slate-500">Overall Health Score</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: healthColor(aircraft.healthScore) }}>
              {Math.round(aircraft.healthScore)}%
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar value={aircraft.healthScore} color={healthColor(aircraft.healthScore)} height={6} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Fleet average {Math.round(fleetAvg)}%
          </p>
        </div>

        {/* component health */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Component Health</p>

          <AircraftHealthMap
            components={aircraft.components}
            selected={flashKey}
            onSelect={handleZoneSelect}
          />

          <div ref={rowsRef} className="space-y-2 mt-4">
            {(Object.keys(aircraft.components) as (keyof Aircraft['components'])[]).map((k) => (
              <div
                key={k}
                data-comp={k}
                className={`flex items-center gap-3 rounded-sm border-l-2 pl-2 -ml-2 transition-colors ${
                  flashKey === k ? 'ag-row-flash border-l-navy' : 'border-l-transparent'
                }`}
              >
                <span className="text-xs text-slate-600 w-24">{COMPONENT_LABELS[k]}</span>
                <div className="flex-1">
                  <ProgressBar
                    value={aircraft.components[k]}
                    color={healthColor(aircraft.components[k])}
                    height={5}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-600 w-9 text-right">
                  {Math.round(aircraft.components[k])}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* live sensors */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Live Sensor Readings
          </p>
          {reading ? (
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['Engine Temp', reading.engineTemp, '°C', 'engineTemp'],
                  ['Vibration', reading.vibration, 'g', 'vibration'],
                  ['Oil Pressure', reading.oilPressure, 'psi', 'oilPressure'],
                  ['Fuel Flow', reading.fuelFlow, 'kg/h', 'fuelFlow'],
                ] as const
              ).map(([label, val, unit, key]) => {
                const r = SENSOR_RANGES[key];
                const bad = r.higherIsBad ? val > r.max : val < r.min;
                return (
                  <div key={label} className={`rounded-lg border p-2.5 ${bad ? 'border-bad/30 bg-bad/5' : 'border-slate-100'}`}>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{label}</p>
                    <p className={`text-sm font-bold tabular-nums ${bad ? 'text-bad' : 'text-slate-800'}`}>
                      {val.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                    </p>
                    <p className="text-[9px] text-slate-300">
                      normal {r.min}–{r.max} {unit}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Awaiting first reading…</p>
          )}
        </div>

        {/* prediction */}
        {prediction ? (
          <div className="rounded-lg border border-bad/25 bg-bad/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800">Predicted fault — {prediction.component}</p>
              <SeverityBadge severity={prediction.severity} />
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Failure in <span className="font-bold text-bad">~{hoursToHuman(prediction.estimatedFailureHours)}</span>{' '}
              · confidence {prediction.confidence}%
            </p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{prediction.recommendedAction}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-ok/25 bg-ok/5 p-4">
            <p className="text-xs font-medium text-ok">No active fault predictions for this airframe.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Last Maintenance</p>
            <p className="text-slate-700 font-medium mt-1">{fmtDate(aircraft.lastMaintenance)}</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Engine Cycles</p>
            <p className="text-slate-700 font-medium mt-1 tabular-nums">{aircraft.engineCycles.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
            navigate('/commander/alerts');
          }}
          className="w-full h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:border-navy/40 hover:text-navy transition-colors"
        >
          Full technical details available on Engineer Dashboard
        </button>
      </div>
    </SlideOver>
  );
}
