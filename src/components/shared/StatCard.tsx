'use client';

import type { LucideIcon } from 'lucide-react';

/* ============================================================
   Stat card — icon circle left, big number, grey label
   ============================================================ */

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sub?: string;
  iconColor?: string;
  iconBg?: string;
  delay?: number;
  onClick?: () => void;
}

export default function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  iconColor = '#1B2B4B',
  iconBg = 'rgba(27,43,75,0.08)',
  delay = 0,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`ag-card ag-fade p-4 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:border-navy/30 transition-colors' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-tight tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 font-medium truncate">{label}</div>
        {sub ? <div className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</div> : null}
      </div>
    </div>
  );
}
