'use client';

import { CheckCircle2, Plane } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import type { ImpactRisk } from '@/data/missionImpact';

/* ============================================================
   Commander — Approve Aircraft Substitution confirmation.
   Frontend-only command action.
   ============================================================ */

const RISK_STYLE: Record<ImpactRisk, string> = {
  LOW: 'bg-ok/10 text-ok border-ok/25',
  MEDIUM: 'bg-warn/10 text-warn border-warn/25',
  HIGH: 'bg-bad/10 text-bad border-bad/25',
  CRITICAL: 'bg-bad text-white border-bad',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-slate-100 bg-cloud p-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-xs font-bold text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export default function SubstitutionModal({
  open,
  onClose,
  unavailableId,
  unavailableName,
  replacementId,
  replacementName,
  protectedSorties,
  riskBefore,
  riskAfter,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  unavailableId: string;
  unavailableName: string;
  replacementId: string;
  replacementName: string;
  protectedSorties: number;
  riskBefore: ImpactRisk;
  riskAfter: ImpactRisk;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Approve Aircraft Substitution?"
      width="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:border-navy/40 hover:text-navy transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="h-9 rounded-md bg-navy px-4 text-xs font-semibold text-white hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5"
          >
            <CheckCircle2 size={13} /> Approve Action
          </button>
        </div>
      }
    >
      <div className="space-y-2.5">
        <Row label="Aircraft unavailable">
          {unavailableId} <span className="font-medium text-slate-500">— {unavailableName}</span>
        </Row>
        <Row label="Replacement">
          {replacementId} <span className="font-medium text-slate-500">— {replacementName}</span>
        </Row>
        <Row label="Expected result">
          {protectedSorties} sortie{protectedSorties === 1 ? '' : 's'} protected
        </Row>
        <Row label="Mission risk">
          <span className="flex items-center gap-1.5">
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLE[riskBefore]}`}>
              {riskBefore}
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLE[riskAfter]}`}>
              {riskAfter}
            </span>
          </span>
        </Row>
        <p className="flex items-start gap-1.5 pt-1 text-[10px] text-slate-400">
          <Plane size={11} className="shrink-0 mt-0.5" />
          Simulated command action — updates local state and the command activity log only.
        </p>
      </div>
    </Modal>
  );
}