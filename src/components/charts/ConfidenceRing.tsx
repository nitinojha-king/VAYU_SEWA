'use client';

/* ============================================================
   Circular confidence ring — SVG, animated stroke
   ============================================================ */

export default function ConfidenceRing({
  value,
  size = 74,
  stroke = 7,
  color,
  label = 'confidence',
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const c = color ?? (value >= 80 ? '#EF4444' : value >= 65 ? '#F59E0B' : '#1B2B4B');
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8ECF4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold tabular-nums text-slate-900" style={{ fontSize: size * 0.24 }}>
          {value}%
        </span>
        {size > 60 ? <span className="text-[8px] text-slate-400 uppercase tracking-wide">{label}</span> : null}
      </div>
    </div>
  );
}
