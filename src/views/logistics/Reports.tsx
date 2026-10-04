'use client';

import { useState } from 'react';
import { Package, ShoppingCart, TrendingUp, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  generateInventoryPDF,
  generateProcurementPDF,
  generateConsumptionPDF,
  exportCSV,
} from '@/utils/pdfGenerator';
import { TOP_USED_PARTS, MONTHLY_COST } from '@/data/mockOps';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';

/* ============================================================
   Logistics — Reports (/logistics/reports)
   ============================================================ */

export default function LogisticsReports() {
  const { parts, procurement, user } = useAuthPack();
  const loading = useMockLoading();
  const [busy, setBusy] = useState<string | null>(null);

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
        subtitle="Inventory, procurement and consumption exports — signed with your officer identity"
        help="All reports are generated locally in the browser as PDF or CSV."
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="ag-card p-5 flex flex-col ag-fade">
            <div className="w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center">
              <Package size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3">Inventory Status Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">
              Full stock position with stock values, shortages and restock dates for all {parts.length} line items.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => run('inv', () => generateInventoryPDF(parts, user!))}
                disabled={busy === 'inv'}
                className="h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-60 transition-colors"
              >
                {busy === 'inv' ? 'Generating…' : 'Generate PDF'}
              </button>
              <button
                onClick={() =>
                  exportCSV(
                    `VayuSewa-Inventory-${new Date().toISOString().slice(0, 10)}.csv`,
                    ['Part ID', 'Name', 'Category', 'Quantity', 'Min Required', 'Unit Cost', 'Location', 'Last Restocked'],
                    parts.map((p) => [p.partId, p.name, p.category, p.quantity, p.minimumRequired, p.unitCost, p.location, p.lastRestocked])
                  )
                }
                className="h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:border-navy/40 hover:text-navy transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="ag-card p-5 flex flex-col ag-fade ag-fade-2">
            <div className="w-10 h-10 rounded-full bg-warn/10 text-warn flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3">Procurement Summary</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">
              Every requisition with pipeline value, supplier, expected delivery and current pipeline stage.
            </p>
            <button
              onClick={() => run('proc', () => generateProcurementPDF(procurement, user!))}
              disabled={busy === 'proc'}
              className="mt-auto h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-60 transition-colors"
            >
              {busy === 'proc' ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>

          <div className="ag-card p-5 flex flex-col ag-fade ag-fade-3">
            <div className="w-10 h-10 rounded-full bg-ok/10 text-ok flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3">Parts Consumption Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">
              Top consumed parts and monthly spend over the last 6 months — the demand-side picture for budgeting.
            </p>
            <button
              onClick={() => run('cons', () => generateConsumptionPDF(TOP_USED_PARTS, MONTHLY_COST, user!))}
              disabled={busy === 'cons'}
              className="mt-auto h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-60 transition-colors"
            >
              {busy === 'cons' ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useAuthPack() {
  const data = useData();
  const { user } = useAuth();
  return { ...data, user };
}
