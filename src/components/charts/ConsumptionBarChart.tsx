'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ============================================================
   Top-consumed parts — horizontal bars in navy
   ============================================================ */

export default function ConsumptionBarChart({
  data,
  height = 340,
}: {
  data: { part: string; usage: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 8 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="part"
          width={168}
          tick={{ fontSize: 10, fill: '#475569' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(27,43,75,0.04)' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E8EF', fontSize: 12 }}
          formatter={(v: number) => [`${v} units`, 'Consumed']}
        />
        <Bar dataKey="usage" radius={[0, 4, 4, 0]} animationDuration={800} barSize={14}>
          {data.map((_, i) => (
            <Cell key={i} fill="#1B2B4B" fillOpacity={1 - i * 0.06} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
