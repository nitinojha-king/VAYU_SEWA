'use client';

import { useEffect, useState } from 'react';

/* ============================================================
   Animated progress bar — grows on mount / value change
   ============================================================ */

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  trackClass?: string;
  delay?: number;
}

export default function ProgressBar({
  value,
  color = '#1B2B4B',
  height = 6,
  trackClass = 'bg-cloud',
  delay = 60,
}: ProgressBarProps) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(100, Math.max(0, value))), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className={`w-full rounded-full overflow-hidden ${trackClass}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${w}%`, background: color }}
      />
    </div>
  );
}
