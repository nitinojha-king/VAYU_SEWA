'use client';

import { Package, PackageX, AlertTriangle, ShoppingCart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import { StockBadge, ProcurementStatusBadge } from '@/components/shared/Badge';
import ProgressBar from '@/components/shared/ProgressBar';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate, inrShort } from '@/utils/helpers';
import { SkeletonStat } from '@/components/shared/SkeletonLoader';
import type { StockStatusT } from '@/components/shared/Badge';

export function stockStatus(p: { quantity: number; minimumRequired: number }): StockStatusT {
  if (p.quantity === 0) return 'out-of-stock';
  if (p.quantity <= p.minimumRequired) return 'low-stock';
  return 'in-stock';
}

export { stockStatus as partStockStatus };

/* ============================================================
   Logistics — Inventory Overview (/logistics)
   ============================================================ */

export default function InventoryOverview() {
  const { parts, procurement, workOrders } = useData();
  const loading = useMockLoading();

  const inStock = parts.filter((p) => p.quantity > p.minimumRequired).length;
  const low = parts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumRequired).length;
  const out = parts.filter((p) => p.quantity === 0).length;
  const pending = procurement.filter((o) => o.status !== 'received').length;
  const value = parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);

  const byCategory = ['Hydraulic', 'Engine', 'Avionics', 'Structural'].map((cat) => {
    const items = parts.filter((p) => p.category === cat);
    const healthy = items.filter((p) => p.quantity > p.minimumRequired).length;
    return { cat, total: items.length, healthy, pct: Math.round((healthy / Math.max(1, items.length)) * 100) };
  });

  const attention = parts
    .filter((p) => p.quantity <= p.minimumRequired)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6);

  const openDemand = workOrders.filter((w) => w.status !== 'completed' && w.partsRequired.length > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Overview"
        subtitle="Spare-parts health across all bays — synced with open work orders and AI demand forecast"
        help="Stock status derives from quantity vs minimum required level; shortages are auto-checked when engineers create work orders."
      />

      {loading ? (
        <SkeletonStat count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package} value={inStock} label="Parts in Stock" sub={`${parts.length} line items · ${inrShort(value)}`} delay={0} />
          <StatCard icon={AlertTriangle} value={low} label="Low Stock Items" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={40} />
          <StatCard icon={PackageX} value={out} label="Out of Stock" iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)" delay={80} />
          <StatCard icon={ShoppingCart} value={pending} label="Pending Procurement" sub={`${openDemand} open WOs consuming parts`} delay={120} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="ag-card p-5 ag-fade ag-fade-2">
          <SectionHeader
            title="Category Readiness"
            help="Share of line items above minimum stock per category."
            right={
              <Link to="/logistics/parts" className="text-xs font-semibold text-navy hover:text-navy-hover inline-flex items-center gap-0.5">
                All parts <ChevronRight size={13} />
              </Link>
            }
          />
          <div className="space-y-3.5">
            {byCategory.map((c) => (
              <div key={c.cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-700">
                    {c.cat} <span className="text-slate-400 font-normal">· {c.healthy}/{c.total} healthy</span>
                  </p>
                  <span className="text-xs font-bold text-navy tabular-nums">{c.pct}%</span>
                </div>
                <ProgressBar value={c.pct} color={c.pct >= 75 ? '#22C55E' : c.pct >= 50 ? '#F59E0B' : '#EF4444'} height={6} />
              </div>
            ))}
          </div>
        </section>

        <section className="ag-card p-5 ag-fade ag-fade-3">
          <SectionHeader
            title="Needs Attention"
            help="Items at or below their minimum required level, most critical first."
            right={
              <Link to="/logistics/procurement" className="text-xs font-semibold text-navy hover:text-navy-hover inline-flex items-center gap-0.5">
                Procurement <ChevronRight size={13} />
              </Link>
            }
          />
          <ul className="space-y-2">
            {attention.map((p) => (
              <li key={p.partId} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3.5 py-2.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    p.quantity === 0 ? 'bg-bad' : 'bg-warn'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    {p.partId} <span className="font-medium text-slate-500">· {p.name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">{p.location}</p>
                </div>
                <span className={`text-xs font-bold tabular-nums ${p.quantity === 0 ? 'text-bad' : 'text-warn'}`}>
                  {p.quantity} <span className="text-[10px] font-normal text-slate-400">/ min {p.minimumRequired}</span>
                </span>
                <StockBadge status={stockStatus(p)} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ag-card p-5 ag-fade ag-fade-4">
        <SectionHeader
          title="Recent Procurement Activity"
          help="Latest requisitions raised by you or auto-generated by the work-order stock checker."
          right={
            <Link to="/logistics/tracking" className="text-xs font-semibold text-navy hover:text-navy-hover inline-flex items-center gap-0.5">
              Tracking <ChevronRight size={13} />
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['PO ID', 'Part', 'Qty', 'Status', 'Expected', 'Supplier'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {procurement.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">{o.id}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {o.partName} <span className="text-slate-300">{o.partId}</span>
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{o.quantity}</td>
                  <td className="px-3 py-3">
                    <ProcurementStatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{fmtDate(o.expectedDelivery)}</td>
                  <td className="px-3 py-3 text-[11px] text-slate-500 max-w-[220px] truncate">{o.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
