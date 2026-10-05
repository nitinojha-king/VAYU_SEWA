'use client';

import { CheckCircle2, Plane } from 'lucide-react';
import Modal from '@/components/shared/Modal';

/* ============================================================
   Commander — Approve grounding confirmation.
   Frontend-only: confirms the local Commander decision.
   ============================================================ */

export default function ApproveConfirmModal({
  open,
  onClose,
  aircraftId,
  aircraftName,
  action,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  aircraftId: string;
  aircraftName: string;
  action: string;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Approve Grounding of ${aircraftId}?`}
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
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-md border border-slate-100 bg-cloud p-3">
          <Plane size={15} className="text-navy shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Aircraft</p>
            <p className="text-xs font-bold text-slate-800">
              {aircraftId} <span className="font-medium text-slate-500">— {aircraftName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-md border border-slate-100 bg-cloud p-3">
          <CheckCircle2 size={15} className="text-navy shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Action</p>
            <p className="text-xs font-semibold text-slate-700">{action}</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Simulated command action. Status, mission risk and the command activity log update
          locally — no backend is involved.
        </p>
      </div>
    </Modal>
  );
}