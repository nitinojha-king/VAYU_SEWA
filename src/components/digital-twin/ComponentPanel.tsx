'use client';

import type { Aircraft, ComponentKey } from '@/data/types';
import SlideOver from '@/components/shared/SlideOver';
import ProgressBar from '@/components/shared/ProgressBar';
import ConfidenceRing from '@/components/charts/ConfidenceRing';
import { useData } from '@/context/DataContext';
import { useSensors } from '@/context/SensorContext';
import { COMPONENT_LABELS, healthColor } from '@/utils/healthCalculator';
import { fmtDate, hoursToHuman } from '@/utils/helpers';
import { SENSOR_RANGES, isAnomalous } from '@/utils/sensorSimulator';
import type { SensorMetric } from '@/data/types';

/* ============================================================
   Component detail slide-over for the Digital Twin
   ============================================================ */

const COMPONENT_METRICS: Partial<Record<ComponentKey, SensorMetric[]>> = {
  engine: ['engineTemp', 'vibration'],
  hydraulic: ['oilPressure'],
  fuelSystem: ['fuelFlow'],
  landingGear: ['vibration'],
  avionics: [],
};

export default function ComponentPanel({
  aircraft,
  componentKey,
  onClose,
}: {
  aircraft: Aircraft | null;
  componentKey: ComponentKey | null;
  onClose: () => void;
}) {
  const { predictions } = useData();
  const { latest } = useSensors();

  if (!aircraft || !componentKey) return null;

  const reading = latest[aircraft.id];
  const health = aircraft.components[componentKey];
  const prediction = predictions
    .filter((p) => p.aircraftId === aircraft.id && p.componentKey === componentKey)
    .sort((a, b) => a.estimatedFailureHours - b.estimatedFailureHours)[0];
  const metrics = COMPONENT_METRICS[componentKey] ?? [];

  return (
    <SlideOver
      open={!!aircraft && !!componentKey}
      onClose={onClose}
      title={COMPONENT_LABELS[componentKey]}
      subtitle={`${aircraft.id} — ${aircraft.name}`}
    >
      <div className="space-y-5">
        {/* health */}
        <div className="rounded-lg border border-slate-100 p-4">
          <div className="flex items-end justify-between">
            <p className="text-xs font-medium text-slate-500">Component Health</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: healthColor(health) }}>
              {Math.round(health)}%
            </p>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={health} color={healthColor(health)} height={7} />
          </div>
        </div>

        {/* live sensor readings for this component */}
        {metrics.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Live Sensor Readings
            </p>
            <div className={`grid gap-2 ${metrics.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {metrics.map((m) => {
                const r = SENSOR_RANGES[m];
                const v = reading ? reading[m] : null;
                const bad = v !== null ? isAnomalous(m, v) : false;
                return (
                  <div key={m} className={`rounded-lg border p-3 ${bad ? 'border-bad/30 bg-bad/5' : 'border-slate-100'}`}>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{r.label}</p>
                    <p className={`text-lg font-bold tabular-nums ${bad ? 'text-bad' : 'text-slate-800'}`}>
                      {v !== null ? v.toLocaleString('en-IN') : '—'}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">{r.unit}</span>
                    </p>
                    <p className={`text-[10px] font-medium ${bad ? 'text-bad' : 'text-ok'}`}>
                      {bad ? 'OUT OF RANGE' : 'Nominal'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-100 p-3.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              No direct telemetry channel for this component. Health is derived from built-in test (BIT)
              results, mission reports and correlated vibration signatures.
            </p>
          </div>
        )}

        {/* prediction */}
        {prediction ? (
          <div className="rounded-lg border border-bad/25 bg-bad/5 p-4 flex gap-4">
            <ConfidenceRing value={prediction.confidence} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800">Failure predicted — {prediction.component}</p>
              <p className="text-xs text-slate-600 mt-1">
                Estimated failure in{' '}
                <span className="font-bold text-bad">~{hoursToHuman(prediction.estimatedFailureHours)}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{prediction.recommendedAction}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Detected {prediction.detectedAt} · {prediction.id}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-ok/25 bg-ok/5 p-4">
            <p className="text-xs font-medium text-ok">No fault predicted for this component.</p>
          </div>
        )}

        {/* meta */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Last Maintenance</p>
            <p className="text-slate-700 font-medium mt-1">{fmtDate(aircraft.lastMaintenance)}</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Aircraft Health</p>
            <p className="text-slate-700 font-medium mt-1 tabular-nums">{Math.round(aircraft.healthScore)}%</p>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
