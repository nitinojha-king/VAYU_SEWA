'use client';

import { useState } from 'react';
import { FileText, Download, CalendarRange, ShieldCheck, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  generateFleetHealthPDF,
  generateReadinessPDF,
  generateSchedulePDF,
  exportCSV,
} from '@/utils/pdfGenerator';
import { FLEET_TREND } from '@/data/mockOps';
import { readinessProjection } from '@/utils/selectors';
import { fmtDate } from '@/utils/helpers';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';

/* ============================================================
   Commander — Reports (/commander/reports)
   ============================================================ */

export default function Reports() {
  const { aircraft } = useSensors();
  const { predictions, workOrders, user } = useAuthPack();
  const loading = useMockLoading();
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState<string | null>(null);

  const projection = readinessProjection(aircraft, predictions, workOrders);

  const run = (key: string, fn: () => void) => {
    setBusy(key);
    setTimeout(() => {
      try {
        fn();
      } finally {
        setBusy(null);
      }
    }, 350);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Reports"
        subtitle="Professional PDF exports with Vayu Sewa branding, page numbers and your officer identity"
        help="PDFs are generated locally in your browser — no data leaves this terminal."
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1 — Fleet Health Summary */}
          <div className="ag-card p-5 flex flex-col ag-fade">
            <div className="w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center">
              <FileText size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3">Fleet Health Summary</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">
              Complete fleet status, health scores and availability. Includes stat chips, the 30-day health
              trend, full aircraft status table and active critical alerts.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <CalendarRange size={13} className="text-slate-400" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 rounded border border-slate-200 px-2 text-[11px] text-slate-600 focus:outline-none focus:border-navy flex-1 min-w-0"
              />
              <span className="text-slate-300 text-xs">→</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 rounded border border-slate-200 px-2 text-[11px] text-slate-600 focus:outline-none focus:border-navy flex-1 min-w-0"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Range {fmtDate(from)} — {fmtDate(to)}
            </p>
            <button
              onClick={() =>
                run('fleet', () => generateFleetHealthPDF(aircraft, predictions, FLEET_TREND, user!))
              }
              disabled={busy === 'fleet'}
              className="mt-4 h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-60 transition-colors"
            >
              {busy === 'fleet' ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>

          {/* Card 2 — Mission Readiness */}
          <div className="ag-card p-5 flex flex-col ag-fade ag-fade-2">
            <div className="w-10 h-10 rounded-full bg-ok/10 text-ok flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3">Mission Readiness Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">
              Current and projected aircraft availability for mission planning. Includes readiness
              timeline, notes and the full ready-aircraft list with squadrons.
            </p>
            <button
              onClick={() => run('readiness', () => generateReadinessPDF(aircraft, predictions, projection, user!))}
              disabled={busy === 'readiness'}
              className="mt-auto h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-60 transition-colors"
            >
              {busy === 'readiness' ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>

          {/* Card 3 — Maintenance Schedule */}
          <div className="ag-card p-5 flex flex-col ag-fade ag-fade-3">
            <div className="w-10 h-10 rounded-full bg-warn/10 text-warn flex items-center justify-center">
              <Wrench size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3">Maintenance Schedule</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">
              Upcoming maintenance tasks for the next 30 days with priorities, crews and due dates.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
              <button
                onClick={() => run('sched', () => generateSchedulePDF(workOrders, user!))}
                disabled={busy === 'sched'}
                className="h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-60 transition-colors"
              >
                {busy === 'sched' ? 'Generating…' : 'Generate PDF'}
              </button>
              <button
                onClick={() =>
                  exportCSV(
                    `VayuSewa-Schedule-${new Date().toISOString().slice(0, 10)}.csv`,
                    ['WO ID', 'Aircraft', 'Task', 'Priority', 'Status', 'Crew', 'Due By'],
                    workOrders.map((w) => [w.id, w.aircraftId, w.task, w.priority, w.status, w.assignedCrew, w.dueBy])
                  )
                }
                className="h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:border-navy/40 hover:text-navy transition-colors flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* small pack to avoid triple context hooks noise */
function useAuthPack() {
  const { aircraft } = useSensors();
  const data = useData();
  const auth = useAuth();
  return { aircraft, ...data, user: auth.user };
}
