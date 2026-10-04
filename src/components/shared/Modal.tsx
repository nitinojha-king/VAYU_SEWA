'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/* ============================================================
   Centered modal — white card, backdrop, Esc to close
   ============================================================ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }: ModalProps) {
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-[2px] ag-fade-in" onClick={onClose} />
      <div
        className={`relative bg-white rounded-lg shadow-xl border border-slate-100 w-full ${width} ag-fade max-h-[85vh] flex flex-col`}
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
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto ag-scroll">{children}</div>
        {footer ? <div className="p-4 border-t border-slate-100 bg-white rounded-b-lg">{footer}</div> : null}
      </div>
    </div>
  );
}
