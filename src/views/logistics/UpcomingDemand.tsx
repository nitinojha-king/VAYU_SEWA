'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate, inr } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';
import { partStockStatus } from '@/views/logistics/InventoryOverview';

/* ============================================================
   Logistics — Upcoming Demand (/logistics/demand)
   Parts needed in the next 30 days from work orders + predictions
   ============================================================ */

interface DemandRow {
  partId: string;
  partName: string;
  qtyNeeded: number;
  neededBy: string;
  workOrderId: string;
  aircraftId: string;
  inStock: number;
  status: 'available' | 'shortage' | 'out';
}

export default function UpcomingDemand() {
  const { workOrders, parts, predictions, raiseProcurement } = useData();
  const loading = useMockLoading();
  const [raiseFor, setRaiseFor] = useState<DemandRow | null>(null);
  const [qty, setQty] = useState(0);

  const rows = useMemo<DemandRow[]>(() => {
    const cutoff = Date.now() + 30 * 86400000;
    const map = new Map<string, DemandRow>();
    workOrders
      .filter((w) => w.status !== 'completed' && new Date(w.dueBy).getTime() < cutoff)
      .forEach((w) => {
        w.partsRequired.forEach((pid) => {
          const part = parts.find((p) => p.partId === pid);
          if (!part) return;
          const existing = map.get(pid);
          if (existing) {
            existing.qtyNeeded += 1;
            return;
          }
          const st = partStockStatus(part);
          map.set(pid, {
            partId: pid,
            partName: part.name,
            qtyNeeded: 1,
            neededBy: w.dueBy,
            workOrderId: w.id,
            aircraftId: w.aircraftId,
            inStock: part.quantity,
            status: st === 'out-of-stock' ? 'out' : st === 'low-stock' ? 'shortage' : 'available',
          });
        });
      });
    // predicted maintenance demand (no WO yet) — flagged with the prediction ETA
    predictions
      .filter((p) => new Date(p.detectedAtTs).getTime() < cutoff)
      .forEach((p) => {
        p.partsRequired.forEach((pid) => {
          const part = parts.find((x) => x.partId === pid);
          if (!part || map.has(pid)) return;
          const st = partStockStatus(part);
          map.set(pid, {
            partId: pid,
            partName: part.name,
            qtyNeeded: 1,
            neededBy: new Date(Date.now() + p.estimatedFailureHours * 3600000).toISOString().slice(0, 10),
            workOrderId: `${p.id} (predicted)`,
            aircraftId: p.aircraftId,
            inStock: part.quantity,
            status: st === 'out-of-stock' ? 'out' : st === 'low-stock' ? 'shortage' : 'available',
          });
        });
      });
    const order = { out: 0, shortage: 1, available: 2 } as const;
    return [...map.values()].sort((a, b) => order[a.status] - order[b.status]);
  }, [workOrders, parts, predictions]);

  const shortages = rows.filter((r) => r.status !== 'available').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts Needed — Next 30 Days"
        subtitle={`${rows.length} distinct parts demanded · ${shortages} with shortage or stock-out`}
        help="Demand is aggregated from open work orders and AI predictions. Shortage rows are highlighted amber, stock-outs red."
        actions={
          <button
            onClick={() => {
              rows.filter((r) => r.status !== 'available').forEach((r) =>
                raiseProcurement({
                  partId: r.partId,
                  quantity: Math.max(4, r.qtyNeeded * 3),
                  urgency: r.status === 'out' ? 'critical' : 'warning',
                  aircraftId: r.aircraftId,
                })
              );
            }}
            disabled={shortages === 0}
            className="h-9 px-3.5 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            <ShoppingCart size={14} /> Raise All Procurement
          </button>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : rows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={CalendarDays} title="No parts demand in the next 30 days" message="Open a work order or wait for new predictions." />
        </div>
      ) : (
        <div className="ag-card overflow-x-auto ag-fade ag-fade-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                {['Part Name', 'Qty Needed', 'Needed By', 'Work Order', 'Aircraft', 'In Stock', 'Stock Status', 'Action'].map((h) => (
                  <th key={h} className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${h === 'Action' ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.partId + r.workOrderId}
                  className={`border-b border-slate-50 transition-colors ${
                    r.status === 'out' ? 'bg-bad/5' : r.status === 'shortage' ? 'bg-warn/5' : 'hover:bg-cloud/60'
                  }`}
                >
                  <td className="px-3 py-3 text-xs font-medium text-slate-700">
                    {r.partName} <span className="text-slate-300 font-mono">{r.partId}</span>
                  </td>
                  <td className="px-3 py-3 text-xs font-bold tabular-nums text-slate-700">{r.qtyNeeded}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{fmtDate(r.neededBy)}</td>
                  <td className="px-3 py-3 text-xs font-mono text-slate-500">{r.workOrderId}</td>
                  <td className="px-3 py-3 text-xs font-bold text-slate-700">{r.aircraftId}</td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{r.inStock}</td>
                  <td className="px-3 py-3">
                    {r.status === 'available' ? (
                      <span className="text-[11px] font-semibold text-ok">Available ✓</span>
                    ) : r.status === 'shortage' ? (
                      <span className="text-[11px] font-semibold text-warn">Shortage ⚠</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-bad">Out of Stock ✕</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {r.status !== 'available' ? (
                      <button
                        onClick={() => {
                          setRaiseFor(r);
                          setQty(Math.max(4, r.qtyNeeded * 3));
                        }}
                        className="h-7 px-2.5 rounded-md bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors"
                      >
                        Raise Procurement
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!raiseFor}
        onClose={() => setRaiseFor(null)}
        title={`Raise Procurement — ${raiseFor?.partId ?? ''}`}
        subtitle={raiseFor?.partName}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setRaiseFor(null)} className="flex-1 h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-cloud">
              Cancel
            </button>
            <button
              onClick={() => {
                if (raiseFor) {
                  raiseProcurement({
                    partId: raiseFor.partId,
                    quantity: qty,
                    urgency: raiseFor.status === 'out' ? 'critical' : 'warning',
                    aircraftId: raiseFor.aircraftId,
                    workOrderId: raiseFor.workOrderId,
                  });
                }
                setRaiseFor(null);
              }}
              className="flex-1 h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover"
            >
              Raise Requisition
            </button>
          </div>
        }
      >
        {raiseFor ? (
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Required {raiseFor.qtyNeeded} · in stock {raiseFor.inStock} · unit cost {inr(parts.find((p) => p.partId === raiseFor.partId)?.unitCost ?? 0)}
            </p>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full h-10 rounded border border-slate-200 px-3 text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Estimated cost: <span className="font-bold text-navy">{inr(qty * (parts.find((p) => p.partId === raiseFor.partId)?.unitCost ?? 0))}</span>
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
