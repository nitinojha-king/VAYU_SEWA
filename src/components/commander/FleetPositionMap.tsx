'use client';

import { useMemo, useState } from 'react';
import { Crosshair, MapPin, X } from 'lucide-react';
import { useSensors } from '@/context/SensorContext';
import { useCommand } from '@/context/CommandContext';
import { missionFor } from '@/data/commanderData';
import { getMissionImpactProfile } from '@/data/missionImpact';
import {
  BASE_LOCATIONS,
  estimateTextWidth,
  BANGLADESH_LAND,
  CATEGORY_STYLE,
  CITY_LABELS,
  COUNTRY_LABELS,
  HEADQUARTERS,
  INDIA_OUTLINE,
  ISLANDS,
  MAP_BOUNDS,
  MAP_FILTERS,
  MAP_VIEW,
  MAP_VIEWBOX,
  MISSION_AREAS,
  NEIGHBOR_LAND,
  RIDGES,
  RIVERS,
  SEA_LABELS,
  SRI_LANKA_LAND,
  THAR_LAND,
  buildPositions,
  calculateDistanceKm,
  fleetCounts,
  layoutLabels,
  mapCategory,
  project,
  regionPath,
  rollupByBase,
  scaleBarPx,
  type BaseLocation,
  type LabelRequest,
  type MapFilter,
  type Rect,
} from '@/data/fleetMap';

/* ============================================================
   Fleet Position & Operational Map

   A self-contained SVG operations plate over a recognisable
   India silhouette: coastline, rivers, ridge shading, neighbour
   states, sea and country labels, edge graticule, scale bar and
   north arrow. No mapping dependency, no tiles, no live GPS.

   Positions are deterministic mock coordinates — each base flies
   a fixed formation of its assigned airframes. Label placement is
   a small deterministic packing pass, so no ID ever lands on
   another marker or on a base label.

   Selection still flows through the existing CommandContext and
   the EXISTING decision drawer; nothing here navigates.
   ============================================================ */

interface BaseInfo {
  baseId: string;
  id: string;
}

/** status-coloured aircraft glyph (points north before rotation) */
const PLANE_PATH =
  'M0,-7.6 L1.9,-1.9 L7.2,2.7 L7.2,4.4 L1.8,2.5 L1.8,5.8 L3.7,7.7 L3.7,8.7 L0,7.6 L-3.7,8.7 L-3.7,7.7 L-1.8,5.8 L-1.8,2.5 L-7.2,4.4 L-7.2,2.7 L-1.9,-1.9 Z';

const HQ_ICON = 20;
const HQ_LABEL_X = HEADQUARTERS.x + 16;

/** box for a piece of fixed geography text, used as a label blocker */
function fixedTextBox(
  text: string,
  fontSize: number,
  cx: number,
  cy: number,
  anchor: 'start' | 'middle' | 'end',
  letterSpacing = 0
): Rect {
  const w = Math.round(text.length * (fontSize * 0.62 + letterSpacing) + 4);
  const x = anchor === 'start' ? cx : anchor === 'end' ? cx - w : cx - w / 2;
  return { x, y: cy - fontSize, w, h: fontSize + 5 };
}

export default function FleetPositionMap() {
  const { aircraft, fleetHealth } = useSensors();
  const {
    mapAircraftId,
    selectMapAircraft,
    openAircraft,
    substitutionFor,
  } = useCommand();

  const [filter, setFilter] = useState<MapFilter>('all');
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);

  const positions = useMemo(() => buildPositions(aircraft), [aircraft]);
  const rollups = useMemo(() => rollupByBase(aircraft, positions), [aircraft, positions]);
  const counts = useMemo(() => fleetCounts(aircraft), [aircraft]);

  /* selection from the map OR from the priority queue — one state source */
  const selected = useMemo(
    () => aircraft.find((a) => a.id === mapAircraftId) ?? null,
    [aircraft, mapAircraftId]
  );

  const visible = useMemo(
    () => aircraft.filter((a) => filter === 'all' || mapCategory(a.status) === filter),
    [aircraft, filter]
  );

  /* approved substitutions, so the map can show replacement posture */
  const substitutions = useMemo(() => {
    const out: Record<string, string> = {};
    for (const a of aircraft) {
      const s = substitutionFor(a.id);
      if (s) out[s.replacementId] = a.id;
    }
    return out;
  }, [aircraft, substitutionFor]);

  const selectedPos = selected ? positions[selected.id] : null;

  const distToHq =
    selectedPos != null
      ? calculateDistanceKm(selectedPos.lat, selectedPos.lng, HEADQUARTERS.lat, HEADQUARTERS.lng)
      : null;

  const selectedBase = selectedPos ? rollups[selectedPos.baseId] : null;

  const distToBases =
    selectedPos != null
      ? BASE_LOCATIONS.filter((b) => b.id !== selectedPos.baseId)
          .map((b) => ({
            base: b,
            km: calculateDistanceKm(selectedPos.lat, selectedPos.lng, b.lat, b.lng),
          }))
          .sort((x, y) => x.km - y.km)
      : [];

  const profile = selected ? getMissionImpactProfile(selected) : null;
  const mission = selected ? missionFor(selected.id) : null;
  const missionArea = mission ? MISSION_AREAS.find((m) => m.id === mission.id) : null;
  const sub = selected ? substitutionFor(selected.id) : undefined;

  const rollup = baseInfo ? rollups[baseInfo.baseId] : null;

  /* ---------- fixed geography boxes: labels must never sit on these ---------- */
  const geographyBlockers = useMemo<Rect[]>(() => {
    const out: Rect[] = [];

    for (const s of SEA_LABELS) {
      const p = project(s.lat, s.lng);
      out.push(fixedTextBox(s.name, s.size, p.x, p.y, 'middle', 3));
    }
    for (const c of COUNTRY_LABELS) {
      const p = project(c.lat, c.lng);
      out.push(fixedTextBox(c.name, 7.5, p.x, p.y, 'middle', 1.4));
    }
    for (const c of CITY_LABELS) {
      const p = project(c.lat, c.lng);
      out.push(fixedTextBox(c.name, 6.5, p.x + 5, p.y + 2, 'start', 0.6));
    }
    for (const m of MISSION_AREAS) {
      const p = project(m.lat, m.lng);
      out.push({ x: p.x - m.w / 2 - 3, y: p.y - m.h / 2 - 3, w: m.w + 6, h: m.h + 6 });
    }
    // command HQ marker + its label block
    out.push({ x: HEADQUARTERS.x - HQ_ICON / 2 - 4, y: HEADQUARTERS.y - HQ_ICON / 2 - 4, w: HQ_ICON + 8, h: HQ_ICON + 8 });
    out.push({ x: HQ_LABEL_X - 3, y: HEADQUARTERS.y - 12, w: 96, h: 34 });

    return out;
  }, []);

  /* ---------- deterministic label packing (base labels first) ---------- */
  const labels = useMemo(() => {
    const requests: LabelRequest[] = [];

    for (const b of BASE_LOCATIONS) {
      const r = rollups[b.id];
      const total = r ? r.total : 0;
      if (!b.major && total === 0) continue; // field is not drawn at all
      if (b.major) {
        // two rendered lines: "BASE A" (9.5px) over "AMBALA · 3" (7px)
        const line2 = `${b.label} · ${total}`;
        requests.push({
          id: `base-${b.id}`,
          x: b.x,
          y: b.y,
          text: b.name,
          width: Math.max(
            estimateTextWidth(b.name.toUpperCase(), 9.5, 1),
            estimateTextWidth(line2, 7, 0.6)
          ),
          fontSize: 9.5,
          height: 17,
          order: 0,
          markerRadius: 10,
        });
      } else {
        requests.push({
          id: `base-${b.id}`,
          x: b.x,
          y: b.y,
          text: b.label,
          fontSize: 7,
          height: 10,
          order: 0,
          markerRadius: 8.5,
        });
      }
    }

    for (const a of visible) {
      const pos = positions[a.id];
      if (!pos) continue;
      requests.push({
        id: a.id,
        x: pos.x,
        y: pos.y,
        text: a.id,
        fontSize: 8,
        height: 10,
        order: a.id === mapAircraftId ? 1 : 20,
        markerRadius: 8.5,
      });
    }

    return layoutLabels(requests, geographyBlockers);
  }, [rollups, visible, positions, mapAircraftId, geographyBlockers]);

  /* ---------- distance line geometry ---------- */
  const routeLine = useMemo(() => {
    if (!selectedPos || distToHq == null) return null;
    const ax = selectedPos.x;
    const ay = selectedPos.y;
    const bx = HEADQUARTERS.x;
    const by = HEADQUARTERS.y - HQ_ICON / 2 - 2;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    // midpoint, pushed 15 px off the line so the pill never sits on a marker
    const mx = ax + dx * 0.5 + (-dy / len) * 15;
    const my = ay + dy * 0.5 + (dx / len) * 15;
    return { ax, ay, bx, by, mx, my };
  }, [selectedPos, distToHq]);

  const markerKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  const toggleBase = (b: BaseLocation) => {
    setBaseInfo((prev) => (prev?.baseId === b.id ? null : { baseId: b.id, id: b.id }));
  };

  const scaleSegments = [0, 250, 500];
  const segPx = scaleBarPx(250);
  const latTicks = [10, 20, 30];
  const lngTicks = [70, 80, 90];

  return (
    <section className="ag-card p-5 ag-fade ag-fade-3">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Fleet Position &amp; Operational Map
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Current simulated aircraft positions, command bases and operational distances
          </p>
        </div>
        <div className="flex items-center gap-3 text-right">
          {[
            ['Aircraft', aircraft.length],
            ['Bases', BASE_LOCATIONS.length],
            ['Command HQ', 1],
          ].map(([k, v]) => (
            <div key={k as string}>
              <p className="text-base font-bold text-navy tabular-nums leading-none">{v}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k}</p>
            </div>
          ))}
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MAP_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`h-7 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${
              filter === f.key
                ? 'bg-navy text-white'
                : 'bg-cloud text-slate-500 border border-slate-100 hover:border-navy/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* ---------------- map ---------------- */}
        <div className="relative min-w-0">
          <svg
            viewBox={MAP_VIEWBOX}
            className="w-full rounded-lg border border-slate-200"
            role="img"
            aria-label="Simulated fleet position map of India"
          >
            <defs>
              <clipPath id="india-clip">
                <path d={regionPath(INDIA_OUTLINE)} />
              </clipPath>
              <linearGradient id="sea-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DDEAF4" />
                <stop offset="55%" stopColor="#D2E2EF" />
                <stop offset="100%" stopColor="#BFD6E7" />
              </linearGradient>
              <linearGradient id="land-fill" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#FBF7EE" />
                <stop offset="100%" stopColor="#F2EEE2" />
              </linearGradient>
              <linearGradient id="ridge-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9FB6A8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#9FB6A8" stopOpacity="0" />
              </linearGradient>
              <filter id="land-shadow" x="-6%" y="-6%" width="112%" height="112%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2C4A63" floodOpacity="0.28" />
              </filter>
            </defs>

            {/* ---------- sea ---------- */}
            <rect x={0} y={0} width={MAP_VIEW.w} height={MAP_VIEW.h} fill="url(#sea-fill)" />

            {/* ---------- neighbouring countries (soft, no borders) ---------- */}
            <g fill="#E6EADF">
              {NEIGHBOR_LAND.map((line, i) => (
                <path key={`nb-${i}`} d={regionPath(line)} />
              ))}
              <path d={regionPath(BANGLADESH_LAND)} />
              <path d={regionPath(SRI_LANKA_LAND)} />
              {ISLANDS.map((isl) => {
                const p = project(isl.lat, isl.lng);
                return <circle key={`isl-${isl.lat}`} cx={p.x} cy={p.y} r={isl.r} />;
              })}
            </g>

            {/* ---------- India ---------- */}
            <g filter="url(#land-shadow)">
              <path d={regionPath(INDIA_OUTLINE)} fill="url(#land-fill)" />
            </g>

            {/* terrain, rivers and ridges, all clipped to the landmass */}
            <g clipPath="url(#india-clip)">
              <path d={regionPath(THAR_LAND)} fill="#EFE1BE" opacity={0.7} />
              <g fill="none" stroke="url(#ridge-fade)" strokeWidth={5} strokeLinecap="round" opacity={0.75}>
                {RIDGES.map((r, i) => (
                  <path key={`ridge-${i}`} d={regionPath(r, false)} />
                ))}
              </g>
              <g fill="none" stroke="#8FB6D6" strokeWidth={1} opacity={0.85}>
                {RIVERS.map((r, i) => (
                  <path key={`river-${i}`} d={regionPath(r, false)} />
                ))}
              </g>
            </g>

            {/* coastline — crisp, so the country reads instantly */}
            <path
              d={regionPath(INDIA_OUTLINE)}
              fill="none"
              stroke="#5C7F9B"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* ---------- graticule edge ticks ---------- */}
            <g stroke="#94A9BC" strokeWidth={1} opacity={0.7}>
              {latTicks.map((lat) => {
                const p = project(lat, MAP_BOUNDS.minLng);
                return <line key={`lat-${lat}`} x1={0} y1={p.y} x2={7} y2={p.y} />;
              })}
              {lngTicks.map((lng) => {
                const p = project(MAP_BOUNDS.minLat, lng);
                return <line key={`lng-${lng}`} x1={p.x} y1={MAP_VIEW.h} x2={p.x} y2={MAP_VIEW.h - 7} />;
              })}
            </g>
            <g fill="#7C93A8" fontSize={6.5} fontWeight={600}>
              {latTicks.map((lat) => {
                const p = project(lat, MAP_BOUNDS.minLng);
                return (
                  <text key={`latlbl-${lat}`} x={10} y={p.y + 2.4}>
                    {lat}°N
                  </text>
                );
              })}
              {lngTicks.map((lng) => {
                const p = project(MAP_BOUNDS.minLat, lng);
                return (
                  <text key={`lnglbl-${lng}`} x={p.x} y={MAP_VIEW.h - 10} textAnchor="middle">
                    {lng}°E
                  </text>
                );
              })}
            </g>

            {/* ---------- sea, country and city labels ---------- */}
            {SEA_LABELS.map((s) => {
              const p = project(s.lat, s.lng);
              return (
                <text
                  key={s.name}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  fontSize={s.size}
                  letterSpacing={3}
                  fill="#6E93B4"
                  fontStyle="italic"
                  fontWeight={500}
                >
                  {s.name}
                </text>
              );
            })}
            {COUNTRY_LABELS.map((c) => {
              const p = project(c.lat, c.lng);
              return (
                <text
                  key={c.name}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  fontSize={7.5}
                  letterSpacing={1.4}
                  fill="#8A9A8B"
                  fontWeight={600}
                >
                  {c.name}
                </text>
              );
            })}
            {CITY_LABELS.map((c) => {
              const p = project(c.lat, c.lng);
              return (
                <g key={c.name}>
                  <circle cx={p.x} cy={p.y} r={1.7} fill="#8FA3B4" />
                  <text x={p.x + 5} y={p.y + 2} fontSize={6.5} letterSpacing={0.6} fill="#8FA3B4" fontWeight={600}>
                    {c.name}
                  </text>
                </g>
              );
            })}

            {/* ---------- mission areas ---------- */}
            {MISSION_AREAS.map((m) => {
              const p = project(m.lat, m.lng);
              const isSelArea = missionArea?.id === m.id;
              const w = isSelArea ? m.w + 14 : m.w;
              const h = isSelArea ? m.h + 8 : m.h;
              return (
                <g key={m.id}>
                  <rect
                    x={p.x - w / 2}
                    y={p.y - h / 2}
                    width={w}
                    height={h}
                    rx={6}
                    fill={isSelArea ? '#1B2B4B' : '#4E6E86'}
                    fillOpacity={isSelArea ? 0.13 : 0.06}
                    stroke={isSelArea ? '#1B2B4B' : '#4E6E86'}
                    strokeOpacity={isSelArea ? 0.85 : 0.5}
                    strokeWidth={isSelArea ? 1.5 : 1}
                    strokeDasharray="4 3"
                  />
                  <text
                    x={p.x}
                    y={p.y - 2}
                    textAnchor="middle"
                    fontSize={isSelArea ? 8.5 : 7.5}
                    fontWeight={700}
                    fill={isSelArea ? '#1B2B4B' : '#42627A'}
                    letterSpacing={0.9}
                  >
                    {m.name.toUpperCase()}
                  </text>
                  <text
                    x={p.x}
                    y={p.y + 7.5}
                    textAnchor="middle"
                    fontSize={6.5}
                    fill={isSelArea ? '#41597A' : '#6C879B'}
                    letterSpacing={0.6}
                  >
                    {m.sector.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* ---------- route: selected aircraft → command HQ ---------- */}
            {routeLine && distToHq != null ? (
              <g>
                <line
                  x1={routeLine.ax}
                  y1={routeLine.ay}
                  x2={routeLine.bx}
                  y2={routeLine.by}
                  stroke="#1B2B4B"
                  strokeWidth={1.4}
                  strokeDasharray="7 5"
                  opacity={0.55}
                />
                <circle cx={routeLine.ax} cy={routeLine.ay} r={2.5} fill="#1B2B4B" opacity={0.8} />
                <g transform={`translate(${routeLine.mx} ${routeLine.my})`}>
                  <rect x={-25} y={-10} width={50} height={17} rx={5} fill="#ffffff" stroke="#1B2B4B" strokeWidth={1} />
                  <text x={0} y={2.5} textAnchor="middle" fontSize={9} fill="#1B2B4B" fontWeight={700}>
                    {distToHq} km
                  </text>
                </g>
              </g>
            ) : null}

            {/* ---------- command bases ---------- */}
            {BASE_LOCATIONS.map((b) => {
              const r = rollups[b.id];
              if (!b.major && (!r || r.total === 0)) return null;
              const isSelBase = baseInfo?.baseId === b.id;
              const lab = labels[`base-${b.id}`];
              return (
                <g
                  key={b.id}
                  onClick={() => toggleBase(b)}
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`${b.name} ${b.airfield}, ${r?.total ?? 0} aircraft`}
                  onKeyDown={markerKey(() => toggleBase(b))}
                >
                  {b.major ? (
                    <>
                      <rect
                        x={b.x - 7}
                        y={b.y - 7}
                        width={14}
                        height={14}
                        rx={2.5}
                        fill="#1B2B4B"
                        stroke="#ffffff"
                        strokeWidth={1.6}
                      />
                      <rect x={b.x - 2.6} y={b.y - 2.6} width={5.2} height={5.2} rx={1} fill="#ffffff" opacity={0.9} />
                    </>
                  ) : (
                    <path
                      d={`M${b.x} ${b.y - 5.5} L${b.x + 5.5} ${b.y} L${b.x} ${b.y + 5.5} L${b.x - 5.5} ${b.y} Z`}
                      fill="#5A6B7E"
                      stroke="#ffffff"
                      strokeWidth={1.3}
                    />
                  )}
                  {isSelBase && (
                    <circle cx={b.x} cy={b.y} r={15} fill="none" stroke="#1B2B4B" strokeWidth={1.5} strokeDasharray="3 3" />
                  )}
                  {lab ? (
                    b.major ? (
                      <>
                        <text
                          x={lab.x}
                          y={lab.y - 8}
                          textAnchor={lab.anchor}
                          fontSize={9.5}
                          fontWeight={800}
                          letterSpacing={1}
                          fill="#1B2B4B"
                          paintOrder="stroke"
                          stroke="#ffffff"
                          strokeWidth={2.4}
                          strokeLinejoin="round"
                        >
                          {b.name.toUpperCase()}
                        </text>
                        <text
                          x={lab.x}
                          y={lab.y}
                          textAnchor={lab.anchor}
                          fontSize={7}
                          fontWeight={600}
                          letterSpacing={0.6}
                          fill="#5A6B7E"
                          paintOrder="stroke"
                          stroke="#ffffff"
                          strokeWidth={2.4}
                          strokeLinejoin="round"
                        >
                          {b.label} · {r?.total ?? 0}
                        </text>
                      </>
                    ) : (
                      <text
                        x={lab.x}
                        y={lab.y}
                        textAnchor={lab.anchor}
                        fontSize={7}
                        fontWeight={700}
                        letterSpacing={0.6}
                        fill="#5A6B7E"
                        paintOrder="stroke"
                        stroke="#ffffff"
                        strokeWidth={2.2}
                        strokeLinejoin="round"
                      >
                        {b.label}
                      </text>
                    )
                  ) : null}
                </g>
              );
            })}

            {/* ---------- command HQ ---------- */}
            <g>
              <circle cx={HEADQUARTERS.x} cy={HEADQUARTERS.y} r={20} fill="#1B2B4B" opacity={0.07} />
              <rect
                x={HEADQUARTERS.x - HQ_ICON / 2}
                y={HEADQUARTERS.y - HQ_ICON / 2}
                width={HQ_ICON}
                height={HQ_ICON}
                rx={2.5}
                fill="#1B2B4B"
                stroke="#ffffff"
                strokeWidth={1.8}
              />
              <rect x={HEADQUARTERS.x - 6} y={HEADQUARTERS.y - 4} width={4} height={4} fill="#ffffff" opacity={0.85} />
              <rect x={HEADQUARTERS.x + 2} y={HEADQUARTERS.y - 4} width={4} height={4} fill="#ffffff" opacity={0.85} />
              <rect x={HEADQUARTERS.x - 2} y={HEADQUARTERS.y + 3} width={4} height={4} fill="#ffffff" opacity={0.6} />
              <line
                x1={HEADQUARTERS.x}
                y1={HEADQUARTERS.y - HQ_ICON / 2}
                x2={HEADQUARTERS.x}
                y2={HEADQUARTERS.y - HQ_ICON / 2 - 6}
                stroke="#1B2B4B"
                strokeWidth={1.6}
              />
              <path
                d={`M${HEADQUARTERS.x} ${HEADQUARTERS.y - HQ_ICON / 2 - 6} l7 2.6 l-7 2.6 Z`}
                fill="#EF4444"
              />
              <text x={HQ_LABEL_X} y={HEADQUARTERS.y - 1} fontSize={10.5} fontWeight={800} letterSpacing={1} fill="#1B2B4B">
                COMMAND HQ
              </text>
              <text x={HQ_LABEL_X} y={HEADQUARTERS.y + 9} fontSize={7.5} letterSpacing={1} fill="#5A6B7E" fontWeight={600}>
                NEW DELHI
              </text>
              <text x={HQ_LABEL_X} y={HEADQUARTERS.y + 18} fontSize={6} letterSpacing={0.4} fill="#8A99AB">
                {HEADQUARTERS.lat.toFixed(2)}°N {HEADQUARTERS.lng.toFixed(2)}°E
              </text>
            </g>

            {/* ---------- aircraft ---------- */}
            {visible.map((a) => {
              const pos = positions[a.id];
              if (!pos) return null;
              const cat = mapCategory(a.status);
              const isSel = a.id === mapAircraftId;
              const isCritical = cat === 'critical';
              const isReplacement = !!substitutions[a.id];
              const fill = CATEGORY_STYLE[cat].fill;
              const lab = labels[a.id];
              const scale = isSel ? 0.92 : 0.66;

              return (
                <g
                  key={a.id}
                  onClick={() => selectMapAircraft(isSel ? null : a.id)}
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`${a.id} ${a.name}, ${CATEGORY_STYLE[cat].label}`}
                  onKeyDown={markerKey(() => selectMapAircraft(isSel ? null : a.id))}
                >
                  {/* status halo — keeps clusters readable */}
                  {(isCritical || isSel) && (
                    <circle cx={pos.x} cy={pos.y} r={13} fill={fill} opacity={0.16} />
                  )}
                  {/* replacement posture */}
                  {isReplacement && (
                    <circle cx={pos.x} cy={pos.y} r={12} fill="none" stroke="#22C55E" strokeWidth={1.4} strokeDasharray="3 3" opacity={0.8} />
                  )}
                  {/* selection ring */}
                  {isSel && (
                    <circle cx={pos.x} cy={pos.y} r={15} fill="none" stroke="#1B2B4B" strokeWidth={2} />
                  )}
                  <g transform={`translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) rotate(${pos.rotation}) scale(${scale})`}>
                    <path
                      d={PLANE_PATH}
                      fill={fill}
                      stroke={isSel ? '#1B2B4B' : '#ffffff'}
                      strokeWidth={isSel ? 1.6 : 1.4}
                      strokeLinejoin="round"
                    />
                  </g>
                  {isCritical && <circle cx={pos.x} cy={pos.y} r={2.2} fill="#ffffff" />}
                  {lab ? (
                    isSel ? (
                      <>
                        <rect
                          x={lab.box.x - 2}
                          y={lab.box.y - 1}
                          width={lab.box.w + 4}
                          height={lab.box.h + 2}
                          rx={4}
                          fill="#1B2B4B"
                        />
                        <text x={lab.x + 1.5} y={lab.y - 1} textAnchor={lab.anchor} fontSize={9} fontWeight={700} fill="#ffffff">
                          {a.id}
                        </text>
                      </>
                    ) : (
                      <text
                        x={lab.x}
                        y={lab.y - 1}
                        textAnchor={lab.anchor}
                        fontSize={8}
                        fontWeight={600}
                        letterSpacing={0.3}
                        fill={isCritical ? '#8C2F2F' : '#33475B'}
                        paintOrder="stroke"
                        stroke="#ffffff"
                        strokeWidth={2.2}
                        strokeLinejoin="round"
                      >
                        {a.id}
                      </text>
                    )
                  ) : null}
                </g>
              );
            })}

            {/* ---------- north arrow ---------- */}
            <g transform={`translate(${MAP_VIEW.w - 38} 34)`}>
              <circle cx={0} cy={0} r={15} fill="#ffffff" opacity={0.9} stroke="#C3CEDA" strokeWidth={0.9} />
              <text x={0} y={-2} textAnchor="middle" fontSize={11} fontWeight={800} fill="#2D3E50">
                N
              </text>
              <path d="M0 3 L4.5 11 L0 8.6 L-4.5 11 Z" fill="#2D3E50" />
            </g>

            {/* ---------- scale bar ---------- */}
            <g transform={`translate(22 ${MAP_VIEW.h - 26})`}>
              <rect x={-12} y={-24} width={segPx * 2 + 34} height={38} rx={6} fill="#ffffff" opacity={0.92} stroke="#C3CEDA" strokeWidth={0.8} />
              {scaleSegments.map((km, i) => (
                <g key={km}>
                  <line x1={i * segPx} y1={-10} x2={i * segPx} y2={-4} stroke="#2D3E50" strokeWidth={1.2} />
                  <text
                    x={i * segPx}
                    y={9}
                    textAnchor={i === 0 ? 'start' : i === scaleSegments.length - 1 ? 'end' : 'middle'}
                    fontSize={7.5}
                    fill="#2D3E50"
                    fontWeight={600}
                  >
                    {km === 0 ? '0' : km}
                  </text>
                </g>
              ))}
              <line x1={0} y1={-7} x2={segPx * 2} y2={-7} stroke="#2D3E50" strokeWidth={2} />
              <rect x={0} y={-9.5} width={segPx} height={5} fill="#2D3E50" />
              <rect x={segPx} y={-9.5} width={segPx} height={5} fill="#ffffff" />
              <rect x={segPx} y={-9.5} width={segPx} height={5} fill="none" stroke="#2D3E50" strokeWidth={0.8} />
              <text x={segPx * 2 + 6} y={-2} fontSize={6.5} fill="#5A6B7E" fontStyle="italic">
                km
              </text>
            </g>

            {/* ---------- in-map legend ---------- */}
            <g transform="translate(12 12)">
              <rect x={0} y={0} width={148} height={86} rx={7} fill="#ffffff" opacity={0.92} stroke="#C3CEDA" strokeWidth={0.8} />
              {(Object.keys(CATEGORY_STYLE) as (keyof typeof CATEGORY_STYLE)[]).map((k, i) => (
                <g key={k} transform={`translate(10 ${13 + i * 12})`}>
                  <circle cx={0} cy={0} r={3.6} fill={CATEGORY_STYLE[k].fill} stroke="#ffffff" strokeWidth={0.8} />
                  <text x={8} y={3} fontSize={7.5} fill="#41566B" fontWeight={600}>
                    {CATEGORY_STYLE[k].label} aircraft
                  </text>
                </g>
              ))}
              <g transform="translate(10 61)">
                <rect x={-4} y={-4} width={8} height={8} rx={1.4} fill="#1B2B4B" />
                <text x={8} y={3} fontSize={7.5} fill="#41566B" fontWeight={600}>
                  Command base
                </text>
              </g>
              <g transform="translate(10 73)">
                <path d="M0 -3.6 L3.6 0 L0 3.6 L-3.6 0 Z" fill="#5A6B7E" />
                <text x={8} y={3} fontSize={7.5} fill="#41566B" fontWeight={600}>
                  Operating field
                </text>
              </g>
              <g transform="translate(88 61)">
                <rect x={-4} y={-3} width={8} height={6} rx={1} fill="none" stroke="#4E6E86" strokeDasharray="2 1.6" strokeWidth={0.9} />
                <text x={8} y={3} fontSize={7.5} fill="#41566B" fontWeight={600}>
                  Mission area
                </text>
              </g>
              <g transform="translate(88 73)">
                <line x1={-4} y1={0} x2={4} y2={0} stroke="#1B2B4B" strokeWidth={1.2} strokeDasharray="3 2" />
                <text x={8} y={3} fontSize={7.5} fill="#41566B" fontWeight={600}>
                  Route to HQ
                </text>
              </g>
            </g>
          </svg>

          {/* base popover */}
          {baseInfo && rollup ? (
            <div className="absolute bottom-2 right-2 w-60 rounded-lg border border-slate-200 bg-white/97 p-3 shadow-lg z-10 backdrop-blur">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 truncate">
                    {rollup.base.name} — {rollup.base.label}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {rollup.base.airfield.replace('AF Stn ', '')} · {rollup.total} aircraft
                  </p>
                </div>
                <button
                  onClick={() => setBaseInfo(null)}
                  aria-label="Close base details"
                  className="text-slate-300 hover:text-slate-500 shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                {[
                  ['Ready', rollup.ready, 'text-ok'],
                  ['Restr.', rollup.restricted, 'text-warn'],
                  ['Maint.', rollup.maintenance, 'text-navy'],
                  ['Crit.', rollup.critical, 'text-bad'],
                ].map(([k, v, cls]) => (
                  <div key={k as string} className="rounded-md bg-cloud py-1.5">
                    <p className={`text-xs font-bold tabular-nums ${cls}`}>{v}</p>
                    <p className="text-[9px] text-slate-400">{k}</p>
                  </div>
                ))}
              </div>
              {rollup.aircraftIds.length ? (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                    Aircraft
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rollup.aircraftIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          selectMapAircraft(id);
                          setBaseInfo(null);
                        }}
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${
                          mapAircraftId === id
                            ? 'border-navy bg-navy text-white'
                            : 'border-slate-200 text-slate-500 hover:border-navy/40 hover:text-navy'
                        }`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ---------------- side panel ---------------- */}
        <div className="rounded-lg border border-slate-100 bg-cloud/50 p-3.5">
          {selected && selectedPos && profile ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Selected Asset
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">{selected.id}</p>
                  <p className="text-[11px] text-slate-500 truncate">{selected.name}</p>
                </div>
                <button
                  onClick={() => selectMapAircraft(null)}
                  aria-label="Clear selection"
                  className="text-slate-300 hover:text-slate-500"
                >
                  <X size={13} />
                </button>
              </div>

              <dl className="mt-3 space-y-1.5">
                {[
                  ['Status', CATEGORY_STYLE[mapCategory(selected.status)].label],
                  ['Base', selectedBase ? `${selectedBase.base.name} · ${selectedBase.base.label}` : '—'],
                  ['Position', `${selectedPos.lat.toFixed(2)}°N ${selectedPos.lng.toFixed(2)}°E`],
                  ['Mission', mission ? mission.name : 'Unassigned'],
                  ['Health', `${Math.round(selected.healthScore)}%`],
                  ['Distance to HQ', distToHq != null ? `${distToHq} km` : '—'],
                  [
                    'Nearest base',
                    distToBases[0] ? `${distToBases[0].base.name} · ${distToBases[0].km} km` : '—',
                  ],
                  [
                    'Mission impact',
                    `${profile.sortiesAffected} sortie${profile.sortiesAffected === 1 ? '' : 's'}`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <dt className="text-[10px] text-slate-400 shrink-0">{k}</dt>
                    <dd className="text-[11px] font-semibold text-slate-700 text-right">{v}</dd>
                  </div>
                ))}
              </dl>

              {missionArea ? (
                <p className="mt-2 rounded-md bg-white px-2 py-1.5 text-[10px] text-slate-500">
                  Mission area: {missionArea.sector}
                </p>
              ) : null}

              {sub ? (
                <p className="mt-2 rounded-md border border-ok/25 bg-ok/5 px-2 py-1.5 text-[10px] font-semibold text-ok">
                  Replaced by {sub.replacementId}
                </p>
              ) : null}

              <button
                onClick={() => openAircraft(selected.id)}
                className="mt-3 h-8 w-full rounded-md bg-navy text-[11px] font-semibold text-white hover:bg-navy-hover transition-colors"
              >
                View Decision
              </button>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <Crosshair size={20} className="text-slate-300" />
              <p className="mt-2 text-[11px] font-semibold text-slate-500">No asset selected</p>
              <p className="mt-0.5 text-[10px] text-slate-400 max-w-[180px]">
                Click an aircraft marker or a base on the map.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* legend + summary */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(CATEGORY_STYLE) as (keyof typeof CATEGORY_STYLE)[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_STYLE[k].fill }} />
              {CATEGORY_STYLE[k].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2.5 h-2.5 bg-navy rounded-sm" />
            Command base
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
            Operating field
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-3 h-2 border border-dashed border-navy/60 rounded-[2px]" />
            Mission area
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
          <span>{aircraft.length} aircraft tracked</span>
          <span>{counts.ready} ready</span>
          <span>{counts.restricted} restricted</span>
          <span>{counts.critical} critical</span>
          <span>{counts.maintenance} maintenance</span>
          <span>{BASE_LOCATIONS.length} operating fields</span>
          <span>1 command HQ</span>
          <span className="text-slate-300">Fleet health {fleetHealth}%</span>
        </div>
      </div>

      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-300">
        <MapPin size={10} /> Simulated fleet positions for demonstration — not live tracking.
      </p>
    </section>
  );
}
