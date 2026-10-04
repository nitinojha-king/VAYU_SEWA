'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FleetTrendPoint } from '@/data/types';

/* ============================================================
   Fleet health trend — 30 days, single smooth navy line
   ============================================================ */

export default function HealthTrendChart({ data, height = 240 }: { data: FleetTrendPoint[]; height?: number }) {
  const current = data[data.length - 1]?.health ?? 0;
  const peak = Math.max(...data.map((d) => d.health));
  const lowest = Math.min(...data.map((d) => d.health));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E8EF', fontSize: 12 }}
            labelStyle={{ color: '#64748B', fontSize: 11 }}
            formatter={(v: number) => [`${v}%`, 'Fleet Health']}
          />
          <Line
            type="monotone"
            dataKey="health"
            stroke="#1B2B4B"
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4, fill: '#1B2B4B' }}
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-slate-400 mt-2">
        Current: <span className="font-semibold text-navy">{current}%</span> · Peak:{' '}
        <span className="font-semibold text-ok">{peak}%</span> · Lowest:{' '}
        <span className="font-semibold text-bad">{lowest}%</span>
      </p>
    </div>
  );
}
