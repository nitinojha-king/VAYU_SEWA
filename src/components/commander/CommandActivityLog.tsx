'use client';

import { useCommand } from '@/context/CommandContext';
import type { CommandLogEntry } from '@/data/commanderData';

/* ============================================================
   Commander — Recent Command Decisions (local activity log)
   ============================================================ */

const TONE: Record<CommandLogEntry['tone'], string> = {
  approved: 'bg-ok',
  override: 'bg-warn',
  transfer: 'bg-navy',
  info: 'bg-slate-300',
};

export default function CommandActivityLog() {
  const { log, clearLog } = useCommand();

  return (
    <section className="ag-card p-5 ag-fade ag-fade-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recent Command Decisions</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Local activity log for this session — resets on reload.
          </p>
        </div>
        <button
          onClick={clearLog}
          className="text-[11px] font-semibold text-slate-400 hover:text-navy transition-colors"
        >
          Reset log
        </button>
      </div>

      <ul className="divide-y divide-slate-50">
        {log.map((e) => (
          <li key={e.id} className="flex items-center gap-3 py-2.5">
            <span className="w-11 shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">
              {e.time}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TONE[e.tone]}`} />
            <span className="w-24 shrink-0 text-[11px] font-bold text-slate-700 truncate">
              {e.ref}
            </span>
            <span className="flex-1 min-w-0 text-[11px] text-slate-600 truncate">{e.action}</span>
            <span className="shrink-0 text-[10px] text-slate-400">{e.actor}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}