'use client';

import { ShoppingCart, Truck, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate, inr, hoursToHuman } from '@/utils/helpers';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';
import EmptyState from '@/components/shared/EmptyState';
import type { ProcurementStatus } from '@/data/types';

/* ============================================================
   Logistics — Procurement Alerts (/logistics/procurement)
   Cards for parts below minimum with approve/ordered actions
   ============================================================ */

export default function ProcurementAlerts() {
  const { parts, procurement, setProcurementStatus, raiseProcurement } = useData();
  const loading = useMockLoading();

  const needsAttention = parts
    .filter((p) => p.quantity <= p.minimumRequired)
    .sort((a, b) => a.quantity - b.quantity);

  const openPoFor = (partId: string) =>
    procurement.find((o) => o.partId === partId && o.status !== 'received');

  const act = (poId: string, status: ProcurementStatus) => setProcurementStatus(poId, status);

  const neededIn = (partId: string): { label: string; urgent: boolean } => {
    const po = openPoFor(partId);
    if (po) {
      const hrs = (new Date(po.expectedDelivery).getTime() - Date.now()) / 3600000;
      return { label: `Expected in ${hoursToHuman(Math.max(0, hrs))}`, urgent: hrs < 48 };
    }
    return { label: 'Needed within 7 days', urgent: true };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Required"
        subtitle={`${needsAttention.filter((p) => p.quantity === 0).length} stock-outs and ${needsAttention.filter((p) => p.quantity > 0).length} low-stock lines need action`}
        help="Approve moves a requisition to the supply chain; Mark as Ordered flips it to In Transit once the supplier confirms."
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : needsAttention.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={CheckCircle} title="All parts above minimum stock" message="Procurement is fully up to date." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {needsAttention.map((p, i) => {
            const po = openPoFor(p.partId);
            const urgency = neededIn(p.partId);
            return (
              <div
                key={p.partId}
                className={`ag-card p-4 ag-fade ${p.quantity === 0 ? 'border-l-[3px] border-l-bad' : 'border-l-[3px] border-l-warn'}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {p.partId} · {p.category}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold ${urgency.urgent ? 'text-bad' : 'text-warn'}`}>{urgency.label}</span>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-cloud px-3 py-2">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Needed</p>
                    <p className="text-xs font-bold text-slate-700 tabular-nums">{Math.max(p.minimumRequired * 2 - p.quantity, 4)} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">In Stock</p>
                    <p className={`text-xs font-bold tabular-nums ${p.quantity === 0 ? 'text-bad' : 'text-warn'}`}>{p.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Est. Cost</p>
                    <p className="text-xs font-bold text-navy tabular-nums">{inr(p.unitCost * Math.max(p.minimumRequired * 2 - p.quantity, 4))}</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  Related: {po?.aircraftId ?? 'AC-007'} · {po?.workOrderId ?? 'WO-0023'} · min level {p.minimumRequired}
                </p>

                {po ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Requisition {po.id} — {po.status.replace('-', ' ')}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      {po.status === 'raised' ? (
                        <button
                          onClick={() => act(po.id, 'approved')}
                          className="h-7 px-2.5 rounded-md bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle size={11} /> Approve
                        </button>
                      ) : po.status === 'approved' ? (
                        <button
                          onClick={() => act(po.id, 'ordered')}
                          className="h-7 px-2.5 rounded-md bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1"
                        >
                          <ShoppingCart size={11} /> Mark as Ordered
                        </button>
                      ) : po.status === 'ordered' ? (
                        <span className="h-7 px-2.5 rounded-md bg-ok/10 text-ok text-[10px] font-bold inline-flex items-center gap-1">
                          <Truck size={11} /> In Transit
                        </span>
                      ) : (
                        <span className="h-7 px-2.5 rounded-md bg-navy-soft text-navy text-[10px] font-bold inline-flex items-center">
                          Ordered
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      raiseProcurement({
                        partId: p.partId,
                        quantity: Math.max(4, p.minimumRequired * 2 - p.quantity),
                        urgency: p.quantity === 0 ? 'critical' : 'warning',
                      })
                    }
                    className="mt-3 w-full h-8 rounded-md bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-1"
                  >
                    <ShoppingCart size={11} /> Raise Procurement
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
