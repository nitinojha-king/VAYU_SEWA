'use client';

import { useState } from 'react';
import type { ComponentHealthMap, ComponentKey } from '@/data/types';
import { COMPONENT_LABELS } from '@/utils/healthCalculator';

/* ============================================================
   Airframe health map — blueprint top-down airframe with five
   colour-coded component zones bound to live component health.
   Pure SVG, no chart library.
   ============================================================ */

const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const RED = '#EF4444';
const OUTLINE = '#CBD5E1';
const LABEL = '#64748B';

export function zoneColor(health: number): string {
  if (health > 80) return GREEN;
  if (health >= 50) return AMBER;
  return RED;
}

const isCritical = (health: number) => health < 50;

function statusLine(health: number): string {
  if (health < 50) return 'Critical — Fault Predicted';
  if (health <= 80) return 'Attention Required';
  return 'Normal';
}

const ZONE_LABEL: Record<ComponentKey, string> = {
  avionics: 'AVIONICS',
  hydraulic: 'HYDRAULIC',
  engine: 'ENGINE',
  fuelSystem: 'FUEL',
  landingGear: 'LANDING GEAR',
};

/** zone id → component it reports on (wings both report fuelSystem) */
type ZoneId = 'avionics' | 'hydraulic' | 'engine' | 'landingGear' | 'fuelLeft' | 'fuelRight';

const ZONE_COMPONENT: Record<ZoneId, ComponentKey> = {
  avionics: 'avionics',
  hydraulic: 'hydraulic',
  engine: 'engine',
  landingGear: 'landingGear',
  fuelLeft: 'fuelSystem',
  fuelRight: 'fuelSystem',
};

interface Zone {
  id: ZoneId;
  ellipse?: { cx: number; cy: number; rx: number; ry: number };
  polygon?: string;
  /** tooltip anchor as % of the viewBox, so it tracks the responsive svg */
  tip: { x: number; y: number };
}

const ZONES: Zone[] = [
  { id: 'avionics', ellipse: { cx: 150, cy: 34, rx: 11, ry: 14 }, tip: { x: 50, y: 19 } },
  { id: 'hydraulic', ellipse: { cx: 150, cy: 82, rx: 13, ry: 20 }, tip: { x: 50, y: 45 } },
  { id: 'landingGear', ellipse: { cx: 150, cy: 112, rx: 19, ry: 9 }, tip: { x: 50, y: 62 } },
  { id: 'engine', ellipse: { cx: 150, cy: 152, rx: 12, ry: 15 }, tip: { x: 50, y: 84 } },
  { id: 'fuelLeft', polygon: '138,80 48,134 44,142 140,118', tip: { x: 28, y: 70 } },
  { id: 'fuelRight', polygon: '162,80 252,134 256,142 160,118', tip: { x: 72, y: 70 } },
];

/** ghost airframe silhouette — fuselage, swept wings, tail fins, nose */
function AirframeBody() {
  return (
    <g fill={OUTLINE} fillOpacity={0.15} stroke={OUTLINE} strokeWidth={1} strokeOpacity={0.55}>
      {/* fuselage */}
      <path d="M150,20 C158,34 162,50 162,70 L162,130 C162,150 158,164 154,172 L146,172 C142,164 138,150 138,130 L138,70 C138,50 142,34 150,20 Z" />
      {/* nose cone */}
      <ellipse cx={150} cy={26} rx={7.5} ry={11} />
      {/* swept wings */}
      <polygon points="138,80 48,134 44,142 140,118" />
      <polygon points="162,80 252,134 256,142 160,118" />
      {/* tail fins */}
      <polygon points="146,142 118,168 110,168 142,152" />
      <polygon points="154,142 182,168 190,168 158,152" />
    </g>
  );
}

function ZoneShape({
  zone,
  ...rest
}: { zone: Zone } & Omit<React.SVGProps<SVGGeometryElement>, 'ref'>) {
  const { ellipse, polygon } = zone;
  if (ellipse)
    return <ellipse cx={ellipse.cx} cy={ellipse.cy} rx={ellipse.rx} ry={ellipse.ry} {...rest} />;
  return <polygon points={polygon} {...rest} />;
}

export default function AircraftHealthMap({
  components,
  selected,
  onSelect,
}: {
  components: ComponentHealthMap;
  selected: ComponentKey | null;
  onSelect: (key: ComponentKey) => void;
}) {
  const [hover, setHover] = useState<ZoneId | null>(null);

  const active = hover;
  const activeComponent = active ? ZONE_COMPONENT[active] : null;
  const activeHealth = activeComponent ? components[activeComponent] : 0;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
        Airframe Health Map
      </p>
      <p className="text-[9px] text-[#CBD5E1] mt-0.5 mb-2">
        Live component status — click any zone for details
      </p>

      <div className="relative">
        <svg
          viewBox="0 0 300 180"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[180px] block"
          role="img"
          aria-label="Airframe component health map"
        >
          <AirframeBody />

          {/* pulsing glow underlay for critical zones */}
          {ZONES.filter((z) => isCritical(components[ZONE_COMPONENT[z.id]])).map((z) => (
            <ZoneShape
              key={`glow-${z.id}`}
              zone={z}
              className="ag-map-glow"
              fill={RED}
              stroke="none"
            />
          ))}

          {/* interactive zones */}
          {ZONES.map((z) => {
            const key = ZONE_COMPONENT[z.id];
            const health = components[key];
            const isSel = selected === key;
            return (
              <g
                key={z.id}
                className="ag-map-zone-wrap"
                tabIndex={0}
                role="button"
                aria-label={`${COMPONENT_LABELS[key]} ${Math.round(health)} percent, ${statusLine(health)}`}
                onMouseEnter={() => setHover(z.id)}
                onMouseLeave={() => setHover((h) => (h === z.id ? null : h))}
                onFocus={() => setHover(z.id)}
                onBlur={() => setHover((h) => (h === z.id ? null : h))}
                onClick={() => onSelect(key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(key);
                  }
                }}
              >
                <ZoneShape
                  zone={z}
                  className={`ag-map-zone${isSel ? ' ag-map-zone-selected' : ''}`}
                  fill={zoneColor(health)}
                  stroke={isSel ? '#1b2b4b' : zoneColor(health)}
                  strokeWidth={isSel ? 1.4 : 0.5}
                  strokeOpacity={isSel ? 1 : 0.5}
                />
              </g>
            );
          })}

          {/* labels */}
          <g fontSize={9} fill={LABEL} textAnchor="middle" fontFamily="Inter, sans-serif">
            <text x={150} y={14}>AVIONICS</text>
            <text x={150} y={58}>HYDRAULIC</text>
            <text x={150} y={127}>LANDING GEAR</text>
            <text x={85} y={126}>FUEL</text>
            <text x={215} y={126}>FUEL</text>
            <text x={150} y={177}>ENGINE</text>
          </g>
        </svg>

        {/* hover tooltip */}
        {active && activeComponent ? (
          <div
            className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg"
            style={{ left: `${ZONES.find((z) => z.id === active)!.tip.x}%`, top: `${ZONES.find((z) => z.id === active)!.tip.y}%` }}
          >
            <p className="text-[11px] font-bold leading-tight text-slate-800">
              {COMPONENT_LABELS[activeComponent]}
            </p>
            <p className="text-[11px] font-bold leading-tight tabular-nums" style={{ color: zoneColor(activeHealth) }}>
              {Math.round(activeHealth)}%
            </p>
            <p className="text-[9px] leading-tight text-slate-400">{statusLine(activeHealth)}</p>
          </div>
        ) : null}
      </div>

      {/* legend */}
      <div className="mt-2 flex items-center justify-center gap-3 text-[9px] text-slate-400">
        {[
          ['>80', GREEN],
          ['50–80', AMBER],
          ['<50', RED],
        ].map(([range, color]) => (
          <span key={range} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color, opacity: 0.6 }} />
            {range}
          </span>
        ))}
      </div>
    </div>
  );
}
