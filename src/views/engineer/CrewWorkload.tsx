'use client';

import { Users } from 'lucide-react';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import ProgressBar from '@/components/shared/ProgressBar';
import { useData } from '@/context/DataContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';

/* ============================================================
   Engineer — Crew & Workload (/engineer/crew)
   ============================================================ */

export default function CrewWorkload() {
  const { crew } = useData();
  const loading = useMockLoading();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crew & Workload"
        subtitle="Technician assignment board — balance the load before the next shift brief"
        help="Workload bar shows completed vs assigned tasks today. Availability dot turns yellow when the crew member is busy."
      />

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="ag-card overflow-x-auto ag-fade">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                {['Crew Name', 'Current Assignment', 'Tasks Today', 'Status', 'Workload'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crew.map((c) => {
                const load = c.tasksAssigned > 0 ? Math.round((c.tasksCompleted / c.tasksAssigned) * 100) : 100;
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                    <td className="px-3 py-3.5">
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.skill}</p>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-600 max-w-[280px]">{c.currentAssignment}</td>
                    <td className="px-3 py-3.5 text-xs tabular-nums text-slate-600">
                      {c.tasksCompleted}/{c.tasksAssigned} done · {c.tasksToday} today
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className={`w-2 h-2 rounded-full ${c.status === 'Available' ? 'bg-ok' : 'bg-warn'}`} />
                        <span className={c.status === 'Available' ? 'text-ok' : 'text-warn'}>{c.status}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1">
                          <ProgressBar value={load} color={load >= 100 ? '#22C55E' : '#1B2B4B'} height={5} />
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums text-slate-400">{load}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="ag-card p-5 ag-fade ag-fade-2">
        <SectionHeader title="Shift Summary" help="Quick capacity picture for the current shift." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Crew', value: crew.length },
            { label: 'Available', value: crew.filter((c) => c.status === 'Available').length },
            { label: 'Busy', value: crew.filter((c) => c.status === 'Busy').length },
            { label: 'Tasks Today', value: crew.reduce((s, c) => s + c.tasksToday, 0) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-cloud p-4 text-center">
              <p className="text-2xl font-bold text-navy tabular-nums">{s.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
          <Users size={12} /> Reassignment suggestions appear here when workload exceeds 80% for any technician.
        </p>
      </section>
    </div>
  );
}
