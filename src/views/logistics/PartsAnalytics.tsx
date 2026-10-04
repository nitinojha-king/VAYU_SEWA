'use client';

import { BarChart3, TrendingUp } from 'lucide-react';
import { PageHeader, SectionHeader } from '@/components/shared/Tooltip';
import ConsumptionBarChart from '@/components/charts/ConsumptionBarChart';
import CostLineChart from '@/components/charts/CostLineChart';
import { TOP_USED_PARTS, MONTHLY_COST } from '@/data/mockOps';
import { useMockLoading, inr } from '@/utils/helpers';
import { SkeletonChart } from '@/components/shared/SkeletonLoader';

/* ============================================================
   Logistics — Parts Analytics (/logistics/analytics)
   ============================================================ */

export default function PartsAnalytics() {
  const loading = useMockLoading();
  const totalSpend = MONTHLY_COST.reduce((s, m) => s + m.cost, 0);
  const avgSpend = Math.round(totalSpend / MONTHLY_COST.length);
  const growth = Math.round(
    ((MONTHLY_COST[MONTHLY_COST.length - 1].cost - MONTHLY_COST[0].cost) / MONTHLY_COST[0].cost) * 100
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consumption Analytics"
        subtitle="What the fleet consumes, when, and what it costs — last 6 months"
        help="Bar lengths share the top-10 consumed parts; the cost line tracks total monthly spend in ₹."
      />

      {loading ? (
        <SkeletonChart h={340} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ag-fade">
            {[
              { label: '6-Month Spend', value: inr(totalSpend) },
              { label: 'Monthly Average', value: inr(avgSpend) },
              { label: 'Trend vs May', value: `+${growth}%` },
              { label: 'Top Consumer', value: 'Engine Oils' },
            ].map((s, i) => (
              <div key={s.label} className="ag-card p-4 ag-fade" style={{ animationDelay: `${i * 40}ms` }}>
                <p className="text-lg font-bold text-navy tabular-nums">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="ag-card p-5 ag-fade ag-fade-2">
              <SectionHeader
                title="Top 10 Most Used Parts"
                help="Units consumed across the last 6 months, all aircraft combined."
                right={<BarChart3 size={14} className="text-slate-300" />}
              />
              <ConsumptionBarChart data={TOP_USED_PARTS} />
            </section>

            <section className="ag-card p-5 ag-fade ag-fade-3">
              <SectionHeader
                title="Monthly Consumption Cost"
                help="Total spare-parts spend per month in Indian Rupees."
                right={<TrendingUp size={14} className="text-slate-300" />}
              />
              <CostLineChart data={MONTHLY_COST} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
