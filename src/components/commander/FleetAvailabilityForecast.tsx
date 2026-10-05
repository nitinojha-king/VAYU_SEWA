'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildForecast, AVAILABILITY_TARGET, type ForecastPoint } from '@/data/commanderData';

/* ============================================================
   Commander — Fleet Availability Forecast (NOW / +6H / +12H / +24H)
   Reuses the Recharts wrapper already in the project.
   ============================================================ */

export default function FleetAvailabilityForecast({
  currentPct,
  height = 200,
}: {
  currentPct: number;
  height?: number;
}) {
  const data: ForecastPoint[] = buildForecast(currentPct);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="availFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B2B4B" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#1B2B4B" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EEF0F5" vertical={false} />
          <XAxis
            dataKey="window"
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={{ stroke: '#E5E8EF' }}
            tickLine={false}
          />
          <YAxis
            domain={[50, 100]}
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            cursor={{ stroke: '#CBD5E1' }}
            contentStyle={{
              background: '#fff',
              border: '1px solid #E5E8EF',
              borderRadius: 8,
              fontSize: 11,
              boxShadow: '0 4px 16px rgba(15,23,42,0.1)',
            }}
            formatter={(v: number) => [`${v}%`, 'Availability']}
            labelFormatter={(l: string) => `Window ${l}`}
          />
          <ReferenceLine
            y={AVAILABILITY_TARGET}
            stroke="#22C55E"
            strokeDasharray="4 4"
            label={{
              value: `Target ${AVAILABILITY_TARGET}%`,
              position: 'insideTopRight',
              fontSize: 9,
              fill: '#22C55E',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#1B2B4B"
            strokeWidth={2}
            fill="url(#availFill)"
            dot={{ r: 3, fill: '#1B2B4B', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}