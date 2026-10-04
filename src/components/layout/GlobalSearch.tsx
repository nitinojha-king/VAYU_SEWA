'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SearchX, Plane, Brain, Wrench, Package } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useSensors } from '@/context/SensorContext';
import { buildSearchItems, createFuse, TYPE_LABELS, type SearchItem } from '@/utils/searchIndex';
import { StatusBadge } from '@/components/shared/Badge';
import type { AircraftStatus } from '@/data/types';

/* ============================================================
   Global search — Ctrl/Cmd + K, Fuse.js across all entities
   ============================================================ */

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { predictions, workOrders, parts } = useData();
  const { aircraft: liveAircraft } = useSensors();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setQ('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const fuse = useMemo(
    () =>
      createFuse(
        buildSearchItems({
          aircraft: liveAircraft.length ? liveAircraft : [],
          predictions,
          workOrders,
          parts,
        })
      ),
    [liveAircraft, predictions, workOrders, parts]
  );

  const results = useMemo(() => {
    if (q.trim().length < 1) return [];
    return fuse.search(q.trim()).slice(0, 12).map((r) => r.item);
  }, [fuse, q]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchItem[]> = {};
    results.forEach((r) => {
      (g[r.type] ??= []).push(r);
    });
    return g;
  }, [results]);

  const ICONS = { aircraft: Plane, prediction: Brain, workorder: Wrench, part: Package } as const;

  if (!open) return null;

  const go = (route: string) => {
    close();
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-[2px] ag-fade-in" onClick={close} />
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-slate-100 ag-fade overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-13 border-b border-slate-100 py-3.5">
          <Search size={16} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search aircraft, predictions, work orders, parts…"
            className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400"
          />
          <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-medium">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto ag-scroll">
          {q && results.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-cloud flex items-center justify-center text-slate-300 mb-3">
                <SearchX size={22} />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                No results found for &ldquo;{q}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-1">Try an aircraft ID, part number or crew name</p>
            </div>
          ) : null}

          {!q ? (
            <div className="px-4 py-6">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick jumps</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'AC-007 — Jaguar MK2', route: '/engineer/aircraft/AC-007' },
                  { label: 'Fault Predictions', route: '/engineer/predictions' },
                  { label: 'Work Orders Board', route: '/engineer/workorders' },
                  { label: 'Parts Inventory', route: '/logistics/parts' },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => go(s.route)}
                    className="text-left text-xs text-slate-600 bg-cloud hover:bg-navy-soft rounded px-3 py-2 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {Object.entries(grouped).map(([type, items]) => {
            const Icon = ICONS[type as keyof typeof ICONS];
            return (
              <div key={type} className="py-2">
                <p className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Icon size={12} /> {TYPE_LABELS[type as SearchItem['type']]} ({items.length})
                </p>
                {items.map((item) => (
                  <button
                    key={item.type + item.id}
                    onClick={() => go(item.route)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-cloud transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.subtitle}</p>
                    </div>
                    {item.type === 'aircraft' ? (
                      <StatusBadge status={item.status as AircraftStatus} />
                    ) : (
                      <span className="text-[11px] text-slate-400 capitalize">{item.status.replace('-', ' ')}</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
