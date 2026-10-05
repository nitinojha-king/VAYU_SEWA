'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import { OVERRIDE_REASONS, type OverrideReason } from '@/data/commanderData';

/* ============================================================
   Commander — Override Recommendation modal.
   Records a local override against the system recommendation.
   ============================================================ */

export default function OverrideModal({
  open,
  onClose,
  aircraftId,
  aircraftName,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  aircraftId: string;
  aircraftName: string;
  onConfirm: (reason: OverrideReason, notes: string) => void;
}) {
  const [reason, setReason] = useState<OverrideReason>('Mission Critical');
  const [notes, setNotes] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override System Recommendation"
      subtitle={`You are overriding the system recommendation for ${aircraftId}.`}
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
              onConfirm(reason, notes);
              setNotes('');
              onClose();
            }}
            className="h-9 rounded-md bg-bad px-4 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Confirm Override
          </button>
        </div>
      }
    >
      <div className="rounded-md border border-warn/25 bg-warn/5 p-3 mb-4">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
          <AlertTriangle size={13} className="text-warn shrink-0 mt-0.5" />
          <span>
            {aircraftId} ({aircraftName}) will be returned to service with an active fault
            prediction. This action is recorded against your command log.
          </span>
        </p>
      </div>

      <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Reason
      </label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as OverrideReason)}
        className="w-full h-9 rounded-md border border-slate-200 px-2.5 text-xs text-slate-700 bg-white outline-none focus:border-navy/40"
      >
        {OVERRIDE_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="block mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Notes <span className="font-normal normal-case text-slate-300">(optional)</span>
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Context for the maintenance log…"
        className="w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-navy/40 resize-none"
      />
    </Modal>
  );
}