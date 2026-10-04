'use client';

import type { LucideIcon } from 'lucide-react';

/* ============================================================
   Friendly empty states — icon + message, never a blank table
   ============================================================ */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  compact?: boolean;
}

export default function EmptyState({ icon: Icon, title, message, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'}`}>
      <div className="w-14 h-14 rounded-full bg-cloud flex items-center justify-center text-navy mb-3">
        <Icon size={24} strokeWidth={1.6} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message ? <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p> : null}
    </div>
  );
}
