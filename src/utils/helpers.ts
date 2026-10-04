/* ============================================================
   General helpers
   ============================================================ */

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function minutesAgoTs(m: number): number {
  return Date.now() - m * 60000;
}

export function hoursAgoTs(h: number): number {
  return Date.now() - h * 3600000;
}

export function daysAgo(d: number): string {
  const dt = new Date(Date.now() - d * 86400000);
  return dt.toISOString().slice(0, 10);
}

export function daysFromNow(d: number): string {
  const dt = new Date(Date.now() + d * 86400000);
  return dt.toISOString().slice(0, 10);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function hoursToHuman(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${Math.round(h)} hrs`;
  const days = Math.round((h / 24) * 10) / 10;
  return `${days} day${days > 1 ? 's' : ''}`;
}

export function initials(name: string): string {
  const clean = name
    .replace(/(Wing Cdr\.|Sqn Ldr\.|Flt Lt\.|Tech Sgt\.|Cpl\.|Sgt\.)/g, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export function inrShort(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Simulated async data load for skeleton states */
export function useMockLoading(): boolean {
  return useLoadingImpl();
}

import { useEffect, useState } from 'react';
function useLoadingImpl(): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);
  return loading;
}
