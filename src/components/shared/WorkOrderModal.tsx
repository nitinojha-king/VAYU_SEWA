'use client';

import { useState } from 'react';
import Modal from '@/components/shared/Modal';
import { useData } from '@/context/DataContext';
import { MOCK_AIRCRAFT } from '@/data/mockAircraft';
import { MOCK_CREW } from '@/data/mockCrew';
import { daysFromNow } from '@/utils/helpers';
import type { Priority } from '@/data/types';

/* ============================================================
   Create work order modal — pre-fills from predictions / AI recs
   ============================================================ */

export interface WOPrefill {
  aircraftId?: string;
  task?: string;
  priority?: Priority;
  partsRequired?: string[];
  estimatedHours?: number;
  fromPredictionId?: string;
}

export default function WorkOrderModal({
  open,
  onClose,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: WOPrefill | null;
}) {
  const { addWorkOrder, parts } = useData();

  const [aircraftId, setAircraftId] = useState('');
  const [task, setTask] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [crew, setCrew] = useState('');
  const [partsText, setPartsText] = useState('');
  const [hours, setHours] = useState(2);
  const [dueBy, setDueBy] = useState(daysFromNow(2));
  const [error, setError] = useState('');
  const [prevOpen, setPrevOpen] = useState(open);

  // re-prefill whenever the modal (re)opens — adjust during render, no effects
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAircraftId(prefill?.aircraftId ?? '');
      setTask(prefill?.task ?? '');
      setPriority(prefill?.priority ?? 'medium');
      setCrew('');
      setPartsText((prefill?.partsRequired ?? []).join(', '));
      setHours(prefill?.estimatedHours ?? 2);
      setDueBy(daysFromNow(2));
      setError('');
    }
  }

  const submit = () => {
    if (!aircraftId) return setError('Select an aircraft.');
    if (!task.trim()) return setError('Enter a task description.');
    addWorkOrder({
      aircraftId,
      task: task.trim(),
      priority,
      assignedCrew: crew || 'Unassigned',
      partsRequired: partsText
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      estimatedHours: Number(hours) || 1,
      dueBy,
      fromPredictionId: prefill?.fromPredictionId,
    });
    onClose();
  };

  const inputCls =
    'w-full h-9 rounded border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10';
  const labelCls = 'text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block';

  // live stock hint for entered part numbers
  const partHints = partsText
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .map((pid) => parts.find((p) => p.partId === pid))
    .filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Work Order"
      subtitle={
        prefill?.fromPredictionId
          ? `Pre-filled from fault prediction ${prefill.fromPredictionId}`
          : 'Raise a maintenance task for the fleet'
      }
      footer={
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-cloud"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover"
          >
            Create Work Order
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Aircraft</label>
            <select value={aircraftId} onChange={(e) => setAircraftId(e.target.value)} className={inputCls}>
              <option value="">Select aircraft…</option>
              {MOCK_AIRCRAFT.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={inputCls}
            >
              {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Task</label>
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Replace hydraulic pump seal"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Assign Crew</label>
            <select value={crew} onChange={(e) => setCrew(e.target.value)} className={inputCls}>
              <option value="">Unassigned</option>
              {MOCK_CREW.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.status === 'Available' ? '· Available' : '· Busy'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Estimated Hours</label>
            <input
              type="number"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Parts Required (comma separated)</label>
            <input
              value={partsText}
              onChange={(e) => setPartsText(e.target.value)}
              placeholder="HYD-2241, SEAL-889"
              className={inputCls}
            />
            {partHints.length > 0 ? (
              <div className="mt-1.5 space-y-0.5">
                {partHints.map((p) => (
                  <p key={p!.partId} className={`text-[10px] ${p!.quantity === 0 ? 'text-bad' : p!.quantity <= p!.minimumRequired ? 'text-warn' : 'text-ok'}`}>
                    {p!.partId}: {p!.quantity} in stock
                    {p!.quantity < p!.minimumRequired ? ' — procurement will be auto-raised' : ''}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label className={labelCls}>Due By</label>
            <input type="date" value={dueBy} onChange={(e) => setDueBy(e.target.value)} className={inputCls} />
          </div>
        </div>

        {error ? <p className="text-xs text-bad font-medium">{error}</p> : null}
      </div>
    </Modal>
  );
}
