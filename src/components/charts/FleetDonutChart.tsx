'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/* ============================================================
   Mission readiness donut — Ready (navy) vs Not Ready (light)
   ============================================================ */

export default function FleetDonutChart({ ready, total }: { ready: number; total: number }) {
  const notReady = Math.max(0, total - ready);
  const data = [
    { name: 'Mission Ready', value: ready },
    { name: 'Not Ready', value: notReady },
  ];
  const pct = total > 0 ? Math.round((ready / total) * 100) : 0;

  return (
    <div className="relative" style={{ height: 190 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={58}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
            paddingAngle={2}
            animationDuration={800}
          >
            <Cell fill="#1B2B4B" />
            <Cell fill="#E8ECF4" />
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E8EF', fontSize: 12 }}
            formatter={(v: number, name: string) => [`${v} aircraft`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-navy tabular-nums">{pct}%</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Ready</span>
      </div>
    </div>
  );
}
