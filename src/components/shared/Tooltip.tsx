'use client';

import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

/* ============================================================
   Contextual help — "?" icon with hover tooltip
   ============================================================ */

export function HelpTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group align-middle ml-1.5">
      <HelpCircle size={13} className="text-slate-300 group-hover:text-navy transition-colors cursor-help" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-navy text-white text-[11px] leading-relaxed rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 shadow-lg">
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-navy" />
      </span>
    </span>
  );
}

/* Page header — big bold title, grey subtitle, optional help */
export function PageHeader({
  title,
  subtitle,
  help,
  actions,
}: {
  title: string;
  subtitle?: string;
  help?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 ag-fade">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
          {title}
          {help ? <HelpTip text={help} /> : null}
        </h1>
        {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

/* Section header with optional help tooltip */
export function SectionHeader({
  title,
  help,
  right,
}: {
  title: string;
  help?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-slate-900 flex items-center">
        {title}
        {help ? <HelpTip text={help} /> : null}
      </h2>
      {right}
    </div>
  );
}
