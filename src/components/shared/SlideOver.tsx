'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/* ============================================================
   Slide-over panel — slides in from the right edge
   ============================================================ */

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export default function SlideOver({ open, onClose, title, subtitle, children, footer, width = 'max-w-md' }: SlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-navy/25 backdrop-blur-[1px] ag-fade-in" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full bg-white ${width} w-full ag-slide-left shadow-2xl border-l border-slate-100 flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:bg-cloud hover:text-slate-600 transition-colors"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto ag-scroll p-5">{children}</div>
        {footer ? <div className="p-4 border-t border-slate-100 bg-white">{footer}</div> : null}
      </div>
    </div>
  );
}
