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

/* ============================================================
   Monthly consumption cost — navy line, ₹ tooltip
   ============================================================ */

export default function CostLineChart({
  data,
  height = 340,
}: {
  data: { month: string; cost: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E8EF', fontSize: 12 }}
          labelStyle={{ color: '#64748B', fontSize: 11 }}
          formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Consumption Cost']}
        />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="#1B2B4B"
          strokeWidth={2.2}
          dot={{ r: 3, fill: '#1B2B4B', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          animationDuration={900}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
