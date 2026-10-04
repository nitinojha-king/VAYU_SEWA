'use client';

import { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, Package, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Tooltip';
import { PriorityBadge } from '@/components/shared/Badge';
import WorkOrderModal from '@/components/shared/WorkOrderModal';
import EmptyState from '@/components/shared/EmptyState';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate } from '@/utils/helpers';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';
import type { WOStatus, WorkOrder } from '@/data/types';

/* ============================================================
   Engineer — Work Orders board (/engineer/workorders)
   Kanban: Pending | In Progress | Completed — click to move
   ============================================================ */

const COLUMNS: { key: WOStatus; label: string; accent: string }[] = [
  { key: 'pending', label: 'Pending', accent: '#F59E0B' },
  { key: 'in-progress', label: 'In Progress', accent: '#1B2B4B' },
  { key: 'completed', label: 'Completed', accent: '#22C55E' },
];

export default function WorkOrdersBoard() {
  const { workOrders, updateWorkOrderStatus } = useData();
  const loading = useMockLoading();
  const [open, setOpen] = useState(false);

  const byStatus = useMemo(() => {
    const map: Record<WOStatus, WorkOrder[]> = { pending: [], 'in-progress': [], completed: [] };
    workOrders.forEach((w) => map[w.status].push(w));
    // pending/in-progress: urgent first; completed: most recent first
    map.pending.sort((a, b) => (a.dueBy > b.dueBy ? 1 : -1));
    map['in-progress'].sort((a, b) => (a.dueBy > b.dueBy ? 1 : -1));
    map.completed.reverse();
    return map;
  }, [workOrders]);

  const move = (w: WorkOrder, dir: -1 | 1) => {
    const order: WOStatus[] = ['pending', 'in-progress', 'completed'];
    const idx = order.indexOf(w.status);
    const next = order[Math.min(2, Math.max(0, idx + dir))];
    if (next !== w.status) updateWorkOrderStatus(w.id, next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Work Orders"
        subtitle={`${workOrders.filter((w) => w.status !== 'completed').length} open tasks across the fleet — move cards between columns as work progresses`}
        help="Click the arrows on a card to advance or send back a work order. Creating an order auto-checks spare-part stock."
        actions={
          <button
            onClick={() => setOpen(true)}
            className="h-9 px-3.5 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> New Work Order
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard lines={6} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col) => (
            <div key={col.key} className="ag-kanban p-3">
              <div className="flex items-center justify-between px-1.5 py-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
                  <p className="text-xs font-bold text-slate-700">{col.label}</p>
                  <span className="text-[10px] font-bold text-slate-400 bg-white rounded-full px-1.5 py-0.5">
                    {byStatus[col.key].length}
                  </span>
                </div>
              </div>
              <div className="space-y-2.5 max-h-[62vh] overflow-y-auto ag-scroll pr-0.5">
                {byStatus[col.key].length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[11px] text-slate-400">
                      {col.key === 'completed'
                        ? 'Nothing completed yet today.'
                        : 'No work orders in this column.'}
                    </p>
                  </div>
                ) : (
                  byStatus[col.key].map((w, i) => (
                    <div
                      key={w.id}
                      className="bg-white rounded-lg border border-slate-100 shadow-sm p-3.5 ag-fade hover:shadow-md transition-shadow"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-semibold">{w.id}</p>
                        <PriorityBadge priority={w.priority} />
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        <Link to={`/engineer/aircraft/${w.aircraftId}`} className="hover:text-navy hover:underline">
                          {w.aircraftId}
                        </Link>
                      </p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{w.task}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {w.partsRequired.map((p) => (
                          <span key={p} className="text-[9px] font-mono font-semibold bg-cloud text-slate-500 rounded px-1.5 py-0.5">
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {w.assignedCrew}
                        </span>
                        <span className={`flex items-center gap-1 ${new Date(w.dueBy).getTime() < Date.now() && w.status !== 'completed' ? 'text-bad font-semibold' : ''}`}>
                          <Clock size={10} /> {fmtDate(w.dueBy)}
                        </span>
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                        <button
                          onClick={() => move(w, -1)}
                          disabled={w.status === 'pending'}
                          className="p-1 rounded text-slate-300 hover:text-navy hover:bg-cloud disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          aria-label="Move back"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="flex items-center gap-1 text-[9px] text-slate-300">
                          <Package size={9} /> {w.estimatedHours}h est.
                        </span>
                        <button
                          onClick={() => move(w, 1)}
                          disabled={w.status === 'completed'}
                          className="p-1 rounded text-slate-400 hover:text-navy hover:bg-cloud disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          aria-label="Move forward"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkOrderModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
