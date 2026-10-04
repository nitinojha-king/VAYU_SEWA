'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { SensorMetric, SensorReading } from '@/data/types';
import { SENSOR_RANGES, isAnomalous } from '@/utils/sensorSimulator';

/* ============================================================
   Live sensor chart — rolling 20-point window, reference band,
   turns red when the current reading is out of range
   ============================================================ */

const NAVY = '#1B2B4B';
const RED = '#EF4444';

export default function SensorChart({
  metric,
  data,
  height = 220,
}: {
  metric: SensorMetric;
  data: SensorReading[];
  height?: number;
}) {
  const r = SENSOR_RANGES[metric];
  const chartData = data.map((d, i) => ({
    i,
    time: new Date(d.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    value: d[metric],
  }));

  const last = chartData[chartData.length - 1];
  const live = data[data.length - 1];
  const bad = live ? isAnomalous(metric, live[metric]) : false;
  const color = bad ? RED : NAVY;

  const allValues = data.map((d) => d[metric]);
  const dataMin = Math.min(...allValues, r.min);
  const dataMax = Math.max(...allValues, r.max);
  const pad = (dataMax - dataMin) * 0.15 || 1;

  return (
    <div className="ag-card p-4 ag-fade">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-slate-700">{r.label}</p>
          <p className="text-[10px] text-slate-400">
            Normal {r.min}–{r.max} {r.unit} · window {chartData.length} pts
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums leading-none" style={{ color: bad ? RED : NAVY }}>
            {live ? live[metric].toLocaleString('en-IN') : '—'}
            <span className="text-[10px] font-normal text-slate-400 ml-1">{r.unit}</span>
          </p>
          {bad ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-bad mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-bad ag-blink" /> ANOMALY
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ok mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" /> NOMINAL
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={36} />
          <YAxis
            tick={{ fontSize: 9, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            domain={[Math.floor(dataMin - pad), Math.ceil(dataMax + pad)]}
            tickFormatter={(v: number) => (r.min < 5 ? v.toFixed(1) : String(Math.round(v)))}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E8EF', fontSize: 11 }}
            labelStyle={{ color: '#64748B', fontSize: 10 }}
            formatter={(value: number) => [`${value} ${r.unit}`, r.label]}
          />
          <ReferenceLine
            y={r.max}
            stroke={r.higherIsBad ? '#EF4444' : '#CBD5E1'}
            strokeDasharray="4 4"
            strokeOpacity={r.higherIsBad ? 0.7 : 0.6}
          />
          <ReferenceLine
            y={r.min}
            stroke={!r.higherIsBad ? '#EF4444' : '#CBD5E1'}
            strokeDasharray="4 4"
            strokeOpacity={!r.higherIsBad ? 0.7 : 0.6}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {last && bad ? (
        <p className="text-[10px] text-bad font-medium mt-1">
          Latest reading {last.value.toLocaleString('en-IN')} {r.unit} exceeds normal range — anomaly engine armed.
        </p>
      ) : null}
    </div>
  );
}
