'use client';

import { useState } from 'react';
import { Gauge, Radio } from 'lucide-react';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import SensorChart from '@/components/charts/SensorChart';
import { useSensors } from '@/context/SensorContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonChart } from '@/components/shared/SkeletonLoader';
import { SENSOR_METRICS, SENSOR_RANGES } from '@/utils/sensorSimulator';
import { healthColor } from '@/utils/healthCalculator';

/* ============================================================
   Engineer — Live Sensor Data (/engineer/sensors)
   Fleet-wide live telemetry with per-aircraft channel focus
   ============================================================ */

export default function LiveSensorData() {
  const { aircraft, readings, latest } = useSensors();
  const loading = useMockLoading();
  const [selectedId, setSelectedId] = useState(aircraft[0]?.id ?? 'AC-007');
  const selected = aircraft.find((a) => a.id === selectedId) ?? aircraft[0];
  const data = readings[selectedId] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Sensor Data"
        subtitle="Raw telemetry straight from the on-board simulator — 2-second tick, 20-point rolling window"
        help="If a channel exceeds its normal band, the line turns red and the anomaly engine starts counting consecutive violations."
      />

      {/* aircraft picker */}
      <div className="flex gap-2 overflow-x-auto ag-scroll pb-1 ag-fade">
        {aircraft.map((a) => {
          const on = a.id === selectedId;
          const r = latest[a.id];
          const hasAnomaly = r ? SENSOR_METRICS.some((m) => (m === 'oilPressure' ? r[m] < SENSOR_RANGES[m].min : r[m] > SENSOR_RANGES[m].max)) : false;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={`shrink-0 rounded-md border px-3 py-2 text-left transition-all min-w-[150px] ${
                on ? 'border-navy bg-navy-soft' : 'border-slate-200 bg-white hover:border-navy/40'
              }`}
            >
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {a.id}
                {hasAnomaly ? <span className="w-1.5 h-1.5 rounded-full bg-bad ag-blink" /> : null}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5" style={{ color: on ? healthColor(a.healthScore) : undefined }}>
                {Math.round(a.healthScore)}% · {a.name}
              </p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SkeletonChart h={220} />
          <SkeletonChart h={220} />
          <SkeletonChart h={220} />
          <SkeletonChart h={220} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 ag-fade-in">
          {selected
            ? SENSOR_METRICS.map((m) => <SensorChart key={m} metric={m} data={data} />)
            : null}
        </div>
      )}

      {/* fleet snapshot */}
      <section className="ag-card p-5 ag-fade ag-fade-2">
        <SectionHeader
          title="Fleet Snapshot — Latest Readings"
          help="One row per aircraft with the most recent value on each channel."
          right={
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ok">
              <Radio size={12} className="ag-blink" /> STREAMING
            </span>
          }
        />
        <div className="overflow-x-auto max-h-96 overflow-y-auto ag-scroll">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100">
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aircraft</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Engine Temp (°C)</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vibration (g)</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Oil Pressure (psi)</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Fuel Flow (kg/h)</th>
              </tr>
            </thead>
            <tbody>
              {aircraft.map((a) => {
                const r = latest[a.id];
                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors cursor-pointer" onClick={() => setSelectedId(a.id)}>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-bold text-slate-800">{a.id}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{a.name}</span>
                    </td>
                    {SENSOR_METRICS.map((m) => {
                      const v = r ? r[m] : null;
                      const rng = SENSOR_RANGES[m];
                      const bad = v !== null && (rng.higherIsBad ? v > rng.max : v < rng.min);
                      return (
                        <td key={m} className={`px-3 py-2.5 text-right text-xs tabular-nums font-medium ${bad ? 'text-bad' : 'text-slate-600'}`}>
                          {v !== null ? v.toLocaleString('en-IN') : '—'}
                          <span className="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full ml-1.5 align-middle" style={{ background: bad ? '#EF4444' : '#22C55E' }} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-300 mt-2 flex items-center gap-1">
          <Gauge size={10} /> Click a row to focus the charts above.
        </p>
      </section>
    </div>
  );
}
