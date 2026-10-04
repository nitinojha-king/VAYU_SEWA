'use client';

import { Truck } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate, inr } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';
import type { ProcurementStatus } from '@/data/types';

/* ============================================================
   Logistics — Procurement Tracking (/logistics/tracking)
   Raised → Approved → Ordered → In Transit → Received stepper
   ============================================================ */

const STEPS: ProcurementStatus[] = ['raised', 'approved', 'ordered', 'in-transit', 'received'];
const STEP_LABELS: Record<ProcurementStatus, string> = {
  raised: 'Raised',
  approved: 'Approved',
  ordered: 'Ordered',
  'in-transit': 'In Transit',
  received: 'Received',
};

export default function ProcurementTracking() {
  const { procurement, setProcurementStatus } = useData();
  const loading = useMockLoading();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Status"
        subtitle={`${procurement.filter((o) => o.status !== 'received').length} active requisitions in the pipeline`}
        help="Each order moves through five gates. Click a step dot to advance the order to that stage."
      />

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="space-y-4">
          {procurement.map((o, i) => {
            const stepIdx = STEPS.indexOf(o.status);
            return (
              <div key={o.id} className="ag-card p-5 ag-fade" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="min-w-0 lg:w-64">
                    <p className="text-xs font-bold text-slate-800">
                      {o.partName} <span className="text-slate-300 font-mono">{o.partId}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {o.id} · Qty {o.quantity} · {inr(o.quantity * o.unitCost)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {o.aircraftId ? `${o.aircraftId} · ${o.workOrderId} · ` : ''}
                      {o.supplier}
                    </p>
                  </div>

                  {/* stepper */}
                  <div className="flex-1 flex items-center">
                    {STEPS.map((s, idx) => {
                      const done = idx <= stepIdx;
                      return (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                          <button
                            onClick={() => setProcurementStatus(o.id, s)}
                            className="flex flex-col items-center gap-1.5 group"
                            title={`Mark as ${STEP_LABELS[s]}`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                done ? 'bg-navy border-navy' : 'bg-white border-slate-300 group-hover:border-navy/60'
                              }`}
                            />
                            <span className={`text-[9px] font-semibold whitespace-nowrap ${done ? 'text-navy' : 'text-slate-400'}`}>
                              {STEP_LABELS[s]}
                            </span>
                          </button>
                          {idx < STEPS.length - 1 ? (
                            <div className="flex-1 h-px mx-1.5 mb-4">
                              <div className={`h-px transition-all ${idx < stepIdx ? 'bg-navy' : 'bg-slate-200'}`} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="lg:text-right lg:w-40">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Expected Delivery</p>
                    <p className={`text-xs font-bold mt-1 ${stepIdx === 4 ? 'text-ok' : 'text-slate-700'}`}>
                      {fmtDate(o.expectedDelivery)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex lg:justify-end items-center gap-1">
                      <Truck size={10} /> {STEP_LABELS[o.status]}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
