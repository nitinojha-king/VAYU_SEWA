'use client';

import type { Aircraft, ComponentKey, FaultPrediction } from '@/data/types';
import { healthColor } from '@/utils/healthCalculator';

/* ============================================================
   Digital Twin — top-view aircraft SVG with 5 clickable
   component zones. Zone fill = component health; pulsing red
   overlay when a fault is predicted for that component.
   ============================================================ */

const ZONES: { key: ComponentKey; label: string; hint: string }[] = [
  { key: 'avionics', label: 'Avionics', hint: 'Nose section' },
  { key: 'fuelSystem', label: 'Fuel System', hint: 'Wing tanks' },
  { key: 'landingGear', label: 'Landing Gear', hint: 'Wing junction' },
  { key: 'hydraulic', label: 'Hydraulic System', hint: 'Fuselage mid' },
  { key: 'engine', label: 'Engine', hint: 'Rear center' },
];

export default function AircraftSVG({
  aircraft,
  predictions,
  onSelect,
}: {
  aircraft: Aircraft;
  predictions: FaultPrediction[];
  onSelect: (k: ComponentKey) => void;
}) {
  const zoneColor = (k: ComponentKey) => healthColor(aircraft.components[k]);
  const zoneFaulted = (k: ComponentKey) =>
    predictions.some((p) => p.aircraftId === aircraft.id && p.componentKey === k && p.severity === 'critical');

  const stroke = '#94A3B8';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 520" className="w-full max-w-md" role="img" aria-label="Aircraft digital twin">
        {/* ---- silhouette ---- */}
        <g stroke={stroke} strokeWidth="1.5" fill="#F8F9FC">
          {/* fuselage */}
          <path d="M200 16 C212 16 219 34 220 62 L223 150 C224 190 222 240 222 300 L222 400 C222 440 216 470 214 486 L186 486 C184 470 178 440 178 400 L178 300 C178 240 176 190 177 150 L180 62 C181 34 188 16 200 16 Z" />
          {/* main wings */}
          <path d="M196 210 C150 240 90 288 58 322 C52 329 50 338 52 346 L64 350 C110 330 160 306 196 288 Z" />
          <path d="M204 210 C250 240 310 288 342 322 C348 329 350 338 348 346 L336 350 C290 330 240 306 204 288 Z" />
          {/* tailplane */}
          <path d="M198 420 L138 456 C134 459 132 464 134 468 L142 469 C164 458 184 448 198 441 Z" />
          <path d="M202 420 L262 456 C266 459 268 464 266 468 L258 469 C236 458 216 448 202 441 Z" />
          {/* canopy */}
          <ellipse cx="200" cy="66" rx="13" ry="26" fill="#E8ECF4" />
          {/* vertical fin (top view) */}
          <rect x="196.5" y="392" width="7" height="80" rx="3" fill="#E8ECF4" />
          {/* nozzle */}
          <rect x="184" y="486" width="32" height="16" rx="4" />
        </g>

        {/* ---- clickable component zones ---- */}

        {/* Avionics — nose */}
        <g className="cursor-pointer" onClick={() => onSelect('avionics')}>
          <title>Avionics — nose section</title>
          <ellipse
            cx="200"
            cy="72"
            rx="25"
            ry="42"
            fill={zoneColor('avionics')}
            fillOpacity="0.3"
            stroke={zoneColor('avionics')}
            strokeWidth="1.5"
          />
          {zoneFaulted('avionics') ? (
            <ellipse cx="200" cy="72" rx="25" ry="42" fill="#EF4444" className="ag-pulse" />
          ) : null}
          <text x="200" y="70" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1B2B4B">AVN</text>
          <text x="200" y="81" textAnchor="middle" fontSize="8" fill="#334155">
            {Math.round(aircraft.components.avionics)}%
          </text>
        </g>

        {/* Landing Gear — wing junction */}
        <g className="cursor-pointer" onClick={() => onSelect('landingGear')}>
          <title>Landing Gear — wing junction</title>
          <rect
            x="178"
            y="182"
            width="44"
            height="60"
            rx="10"
            fill={zoneColor('landingGear')}
            fillOpacity="0.3"
            stroke={zoneColor('landingGear')}
            strokeWidth="1.5"
          />
          {zoneFaulted('landingGear') ? (
            <rect x="178" y="182" width="44" height="60" rx="10" fill="#EF4444" className="ag-pulse" />
          ) : null}
          <text x="200" y="209" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1B2B4B">GEAR</text>
          <text x="200" y="220" textAnchor="middle" fontSize="8" fill="#334155">
            {Math.round(aircraft.components.landingGear)}%
          </text>
        </g>

        {/* Fuel System — wings */}
        <g className="cursor-pointer" onClick={() => onSelect('fuelSystem')}>
          <title>Fuel System — wing tanks</title>
          <path
            d="M84 306 L194 248 L194 278 L84 332 Z"
            fill={zoneColor('fuelSystem')}
            fillOpacity="0.3"
            stroke={zoneColor('fuelSystem')}
            strokeWidth="1.5"
          />
          <path
            d="M316 306 L206 248 L206 278 L316 332 Z"
            fill={zoneColor('fuelSystem')}
            fillOpacity="0.3"
            stroke={zoneColor('fuelSystem')}
            strokeWidth="1.5"
          />
          {zoneFaulted('fuelSystem') ? (
            <>
              <path d="M84 306 L194 248 L194 278 L84 332 Z" fill="#EF4444" className="ag-pulse" />
              <path d="M316 306 L206 248 L206 278 L316 332 Z" fill="#EF4444" className="ag-pulse" />
            </>
          ) : null}
          <text x="140" y="290" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1B2B4B">FUEL</text>
          <text x="260" y="290" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1B2B4B">FUEL</text>
        </g>

        {/* Hydraulic — fuselage mid */}
        <g className="cursor-pointer" onClick={() => onSelect('hydraulic')}>
          <title>Hydraulic System — fuselage mid</title>
          <rect
            x="184"
            y="256"
            width="32"
            height="72"
            rx="8"
            fill={zoneColor('hydraulic')}
            fillOpacity="0.3"
            stroke={zoneColor('hydraulic')}
            strokeWidth="1.5"
          />
          {zoneFaulted('hydraulic') ? (
            <rect x="184" y="256" width="32" height="72" rx="8" fill="#EF4444" className="ag-pulse" />
          ) : null}
          <text x="200" y="288" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1B2B4B">HYD</text>
          <text x="200" y="299" textAnchor="middle" fontSize="8" fill="#334155">
            {Math.round(aircraft.components.hydraulic)}%
          </text>
        </g>

        {/* Engine — rear */}
        <g className="cursor-pointer" onClick={() => onSelect('engine')}>
          <title>Engine — rear center</title>
          <rect
            x="182"
            y="372"
            width="36"
            height="98"
            rx="10"
            fill={zoneColor('engine')}
            fillOpacity="0.3"
            stroke={zoneColor('engine')}
            strokeWidth="1.5"
          />
          {zoneFaulted('engine') ? (
            <rect x="182" y="372" width="36" height="98" rx="10" fill="#EF4444" className="ag-pulse" />
          ) : null}
          <text x="200" y="416" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1B2B4B">ENG</text>
          <text x="200" y="427" textAnchor="middle" fontSize="8" fill="#334155">
            {Math.round(aircraft.components.engine)}%
          </text>
        </g>

        {/* ---- callout labels ---- */}
        <g fontSize="9" fill="#64748B" fontWeight="500">
          <text x="30" y="60">Avionics</text>
          <line x1="66" y1="63" x2="176" y2="68" stroke="#CBD5E1" strokeDasharray="3 3" />
          <text x="352" y="180">Landing Gear</text>
          <line x1="350" y1="183" x2="226" y2="200" stroke="#CBD5E1" strokeDasharray="3 3" />
          <text x="20" y="380">Fuel System</text>
          <line x1="72" y1="376" x2="110" y2="322" stroke="#CBD5E1" strokeDasharray="3 3" />
          <text x="330" y="300">Hydraulic</text>
          <line x1="328" y1="297" x2="220" y2="290" stroke="#CBD5E1" strokeDasharray="3 3" />
          <text x="330" y="430">Engine</text>
          <line x1="328" y1="427" x2="222" y2="420" stroke="#CBD5E1" strokeDasharray="3 3" />
        </g>
      </svg>

      {/* legend */}
      <div className="flex items-center gap-5 mt-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-ok/30 border border-ok" /> Healthy
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-warn/30 border border-warn" /> Warning
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-bad/30 border border-bad" /> Critical
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-bad ag-pulse" /> Fault predicted
        </span>
      </div>
      <p className="text-[10px] text-slate-400 mt-2">Click any highlighted zone for component detail</p>
    </div>
  );
}

export { ZONES };
