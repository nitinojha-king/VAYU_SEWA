'use client';

import { useState } from 'react';
import { Sparkles, ShieldAlert, Timer, Check, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Tooltip';
import WorkOrderModal, { type WOPrefill } from '@/components/shared/WorkOrderModal';
import EmptyState from '@/components/shared/EmptyState';
import { useData } from '@/context/DataContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';

/* ============================================================
   Engineer — AI Recommendations (/engineer/recommendations)
   Act-now vs wait comparison for each prediction
   ============================================================ */

export default function AIRecommendations() {
  const { recommendations, acknowledgePrediction, predictions } = useData();
  const loading = useMockLoading();
  const [prefill, setPrefill] = useState<WOPrefill | null>(null);
  const [open, setOpen] = useState(false);

  const openRecs = recommendations.filter((r) => {
    const p = predictions.find((x) => x.id === r.predictionId);
    return !p?.acknowledged;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Maintenance Recommendations"
        subtitle="Model-generated guidance with cost-of-delay analysis for every active prediction"
        help="Each card compares acting now against waiting, quantified in downtime hours and parts."
      />

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SkeletonCard lines={8} />
          <SkeletonCard lines={8} />
          <SkeletonCard lines={8} />
          <SkeletonCard lines={8} />
        </div>
      ) : openRecs.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={Sparkles} title="All recommendations acknowledged" message="New AI insights will appear as models re-score the fleet." />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {openRecs.map((r, i) => (
            <div key={r.id} className="ag-card p-5 ag-fade flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {r.aircraftId}{' '}
                    <Link to={`/engineer/aircraft/${r.aircraftId}`} className="font-medium text-navy hover:underline">
                      · {r.component}
                    </Link>
                  </p>
                  <p className="text-sm font-semibold text-navy mt-1.5 leading-snug">{r.recommendation}</p>
                </div>
                <span className="w-9 h-9 rounded-full bg-navy-soft text-navy flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed mt-3">
                <span className="font-bold text-slate-600">Why:</span> {r.rationale}
              </p>

              <div className="mt-3 rounded-md bg-bad/5 border border-bad/20 px-3.5 py-2.5 flex items-start gap-2">
                <ShieldAlert size={14} className="text-bad shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-bad">Risk if ignored:</span> {r.riskIfIgnored}
                </p>
              </div>

              {/* act now vs wait */}
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="rounded-lg border border-ok/25 bg-ok/5 p-3">
                  <p className="text-[10px] font-bold text-ok uppercase tracking-wide flex items-center gap-1">
                    <Timer size={11} /> Act now
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1.5">{r.actNow.downtimeHours} hr downtime</p>
                  <p className="text-[11px] text-slate-600">{r.actNow.partsNeeded} part{r.actNow.partsNeeded > 1 ? 's' : ''} needed</p>
                </div>
                <div className="rounded-lg border border-bad/25 bg-bad/5 p-3">
                  <p className="text-[10px] font-bold text-bad uppercase tracking-wide flex items-center gap-1">
                    <Timer size={11} /> Wait
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1.5">{r.wait.downtimeHours} hr downtime</p>
                  <p className="text-[11px] text-slate-600">
                    {r.wait.partsNeeded} parts · {r.wait.missionImpact}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 mt-auto">
                <button
                  onClick={() => acknowledgePrediction(r.predictionId)}
                  className="h-8 px-3 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-500 hover:border-ok/50 hover:text-ok transition-colors inline-flex items-center gap-1"
                >
                  <Check size={12} /> Acknowledge
                </button>
                <button
                  onClick={() => {
                    const p = predictions.find((x) => x.id === r.predictionId);
                    setPrefill({
                      aircraftId: r.aircraftId,
                      task: r.recommendation,
                      priority: p?.severity === 'critical' ? 'critical' : 'high',
                      partsRequired: p?.partsRequired ?? [],
                      estimatedHours: r.actNow.downtimeHours,
                      fromPredictionId: r.predictionId,
                    });
                    setOpen(true);
                  }}
                  className="h-8 px-3 rounded-md bg-navy text-white text-[11px] font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1"
                >
                  <Plus size={12} /> Create Work Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkOrderModal open={open} onClose={() => setOpen(false)} prefill={prefill} />
    </div>
  );
}
