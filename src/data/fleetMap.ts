import type { Aircraft, AircraftStatus } from '@/data/types';

/* ============================================================
   Operational fleet map — simulated geography, self-contained.

   No mapping dependency, no tiles, no live GPS. Everything below
   is deterministic: the same fleet always produces the same map.

   Two coordinate systems:
     • lat/lng — the simulated ground coordinates an airframe
       "reports". Used for the Haversine distances in the side
       panel and for the scale bar.
     • x/y     — view-box pixels. The geography, base anchors and
       label layout all live here so spacing is exact and tunable.

   Airtight rule: every base also carries its real-world lat/lng,
   but the map anchor (x/y) is nudged where the real field would
   collide with a neighbour (documented per entry) — the relative
   layout stays geographically sensible, the spacing stays legible.
   ============================================================ */

export interface BaseLocation {
  id: string;
  name: string;
  /** the exact string used on Aircraft.base */
  airfield: string;
  /** short name drawn on the map */
  label: string;
  lat: number;
  lng: number;
  /** map anchor, view-box pixels */
  x: number;
  y: number;
  /** formation heading of this base's aircraft, SVG degrees (0 = east, 90 = south) */
  heading: number;
  /** lateral spacing between aircraft of the same base (px) */
  spread?: number;
  /** extra forward spacing per aircraft (px) */
  step?: number;
  /** primary command bases (Base A–F) */
  major?: boolean;
  /** why the anchor differs from the real field, if it does */
  note?: string;
}

export interface AircraftPosition {
  aircraftId: string;
  baseId: string;
  /** simulated ground position — feeds the Haversine maths */
  lat: number;
  lng: number;
  /** view-box pixels — feeds rendering */
  x: number;
  y: number;
  /** icon rotation for this airframe (deg) */
  rotation: number;
}

export interface MissionArea {
  id: string;
  name: string;
  sector: string;
  lat: number;
  lng: number;
  /** rectangle size on the map (px) */
  w: number;
  h: number;
}

/* ---------- projection ----------
   Equirectangular with a cos(mid-latitude) correction so east-west
   distances are not stretched, fitted to the Indian subcontinent. */

export const MAP_BOUNDS = { minLat: 5.5, maxLat: 37.5, minLng: 66.5, maxLng: 98.5 };
const VIEW_W = 640;
const VIEW_H = 640;
const COS_MID =
  Math.cos((((MAP_BOUNDS.minLat + MAP_BOUNDS.maxLat) / 2) * Math.PI) / 180);
const PX_PER_LAT = VIEW_H / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
const PX_PER_LNG =
  (VIEW_W * COS_MID) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
/** km per pixel at the map mid-latitude (identical on both axes by construction) */
const KM_PER_PX = 111.32 / PX_PER_LAT;

export const MAP_VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`;
export const MAP_VIEW = { w: VIEW_W, h: VIEW_H };

export function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: Number(((lng - MAP_BOUNDS.minLng) * PX_PER_LNG).toFixed(2)),
    y: Number((VIEW_H - (lat - MAP_BOUNDS.minLat) * PX_PER_LAT).toFixed(2)),
  };
}

export function unproject(x: number, y: number): { lat: number; lng: number } {
  return {
    lat: Number((MAP_BOUNDS.minLat + (VIEW_H - y) / PX_PER_LAT).toFixed(4)),
    lng: Number((MAP_BOUNDS.minLng + x / PX_PER_LNG).toFixed(4)),
  };
}

/** pixel length of a scale-bar segment */
export function scaleBarPx(km: number): number {
  return Number((km / KM_PER_PX).toFixed(1));
}

/* ---------- command HQ ---------- */

export const HEADQUARTERS = {
  id: 'HQ',
  name: 'Command HQ',
  city: 'New Delhi',
  lat: 28.6139,
  lng: 77.209,
  x: 199,
  y: 178,
};

/* ---------- airbases ----------
   Primary command bases carry the Base A–F labels used across the
   app; secondary entries are the remaining operating fields that
   appear on Aircraft.base. Anchors are hand-placed so no two
   markers or formations collide. */

export const BASE_LOCATIONS: BaseLocation[] = [
  /* --- primary command bases --- */
  {
    id: 'BASE-A', name: 'Base A', airfield: 'AF Stn Ambala', label: 'AMBALA',
    lat: 30.38, lng: 76.78, x: 191, y: 142,
    heading: 8, spread: 16, step: 26, major: true,
  },
  {
    id: 'BASE-B', name: 'Base B', airfield: 'AF Stn Tezpur', label: 'TEZPUR',
    lat: 26.63, lng: 92.72, x: 467, y: 217,
    heading: 200, spread: 30, step: 12, major: true,
    note: 'nudged ~100 km west of Tezpur so Base B and Base F (150 km apart in reality) both keep a readable label',
  },
  {
    id: 'BASE-C', name: 'Base C', airfield: 'AF Stn Gwalior', label: 'GWALIOR',
    lat: 26.21, lng: 78.18, x: 221, y: 249,
    heading: 90, spread: 24, step: 8, major: true,
    note: 'nudged ~130 km south of Gwalior to clear the Agra cluster',
  },
  {
    id: 'BASE-D', name: 'Base D', airfield: 'AF Stn Hindan', label: 'HINDAN',
    lat: 28.55, lng: 77.11, x: 169, y: 204,
    heading: 180, spread: 26, step: 8, major: true,
    note: 'Hindan is 25 km from Delhi — moved onto open ground west of the capital so it does not sit on the HQ marker',
  },
  {
    id: 'BASE-E', name: 'Base E', airfield: 'AF Stn Pathankot', label: 'PATHANKOT',
    lat: 32.26, lng: 75.64, x: 156, y: 98,
    heading: 315, spread: 24, step: 8, major: true,
    note: 'nudged slightly west to separate it from Adampur',
  },
  {
    id: 'BASE-F', name: 'Base F', airfield: 'AF Stn Jorhat', label: 'JORHAT',
    lat: 26.75, lng: 94.2, x: 516, y: 215,
    heading: 20, spread: 24, step: 8, major: true,
  },

  /* --- secondary operating fields --- */
  {
    id: 'SEC-SULUR', name: 'Sulur', airfield: 'AF Stn Sulur', label: 'SULUR',
    lat: 11.05, lng: 77.11, x: 197, y: 529, heading: 180, spread: 26, step: 8,
  },
  {
    id: 'SEC-NAL', name: 'Nal', airfield: 'AF Stn Nal', label: 'NAL',
    lat: 28.02, lng: 73.25, x: 126, y: 190, heading: 270, spread: 26, step: 8,
  },
  {
    id: 'SEC-AGRA', name: 'Agra', airfield: 'AF Stn Agra', label: 'AGRA',
    lat: 27.16, lng: 77.96, x: 213, y: 207, heading: 0, spread: 24, step: 8,
  },
  {
    id: 'SEC-ADAMPUR', name: 'Adampur', airfield: 'AF Stn Adampur', label: 'ADAMPUR',
    lat: 31.43, lng: 75.71, x: 171, y: 121, heading: 200, spread: 24, step: 8,
  },
  {
    id: 'SEC-BIDAR', name: 'Bidar', airfield: 'AF Stn Bidar', label: 'BIDAR',
    lat: 17.91, lng: 77.53, x: 205, y: 392, heading: 0, spread: 24, step: 8,
  },
  {
    id: 'SEC-LEH', name: 'Leh', airfield: 'AF Stn Leh', label: 'LEH',
    lat: 34.14, lng: 77.55, x: 206, y: 67, heading: 200, spread: 26, step: 8,
  },
  {
    id: 'SEC-CHANDIGARH', name: 'Chandigarh', airfield: 'AF Stn Chandigarh', label: 'CHANDIGARH',
    lat: 30.67, lng: 76.79, x: 216, y: 110, heading: 315, spread: 24, step: 8,
    note: 'nudged into the foothills to give Ambala (45 km away in reality) room to breathe',
  },
];

export const PRIMARY_BASES = BASE_LOCATIONS.filter((b) => b.major);
export const SECONDARY_BASES = BASE_LOCATIONS.filter((b) => !b.major);

export function baseForAirfield(airfield: string): BaseLocation {
  return BASE_LOCATIONS.find((b) => b.airfield === airfield) ?? BASE_LOCATIONS[0];
}

/* ---------- mission areas ----------
   Placed in open map space so their outlines never sit on a
   base, a formation or the HQ. */

export const MISSION_AREAS: MissionArea[] = [
  { id: 'MSN-4412', name: 'Combat Patrol', sector: 'Western Sector', lat: 25.6, lng: 71.6, w: 96, h: 30 },
  { id: 'MSN-4418', name: 'Reconnaissance', sector: 'Northern Sector', lat: 32.4, lng: 79.6, w: 104, h: 30 },
  { id: 'MSN-4425', name: 'Border Patrol', sector: 'Eastern Sector', lat: 28.6, lng: 95.6, w: 96, h: 30 },
  { id: 'MSN-4431', name: 'Air Superiority', sector: 'Central Sector', lat: 21.0, lng: 78.2, w: 96, h: 30 },
  { id: 'MSN-4437', name: 'Maritime Strike', sector: 'Coastal Sector', lat: 15.2, lng: 87.0, w: 104, h: 30 },
  { id: 'MSN-4442', name: 'Peninsular Patrol', sector: 'Southern Sector', lat: 11.2, lng: 79.6, w: 100, h: 30 },
];

/* ---------- deterministic airframe layout ----------
   Aircraft based at a field fly a loose formation off that field:
   heading and spacing come from the base, index within the base is
   fixed by aircraft ID. No randomness, no jitter. */

const DEFAULT_SPREAD = 30;
const DEFAULT_STEP = 12;
const FORMATION_LEAD = 12;

export function buildPositions(fleet: Aircraft[]): Record<string, AircraftPosition> {
  const groups: Record<string, Aircraft[]> = {};
  for (const a of fleet) {
    const b = baseForAirfield(a.base);
    (groups[b.id] ??= []).push(a);
  }

  const out: Record<string, AircraftPosition> = {};
  for (const b of BASE_LOCATIONS) {
    const list = (groups[b.id] ?? []).slice().sort((p, q) => p.id.localeCompare(q.id));
    const n = list.length;
    if (n === 0) continue;

    const rad = (b.heading * Math.PI) / 180;
    const fx = Math.cos(rad);
    const fy = Math.sin(rad);
    const px = -Math.sin(rad);
    const py = Math.cos(rad);
    const spread = b.spread ?? DEFAULT_SPREAD;
    const step = b.step ?? DEFAULT_STEP;

    list.forEach((a, i) => {
      const lateral = (i - (n - 1) / 2) * spread;
      const forward = FORMATION_LEAD + i * step;
      const x = Number((b.x + fx * forward + px * lateral).toFixed(2));
      const y = Number((b.y + fy * forward + py * lateral).toFixed(2));
      const { lat, lng } = unproject(x, y);
      out[a.id] = {
        aircraftId: a.id,
        baseId: b.id,
        lat,
        lng,
        x,
        y,
        rotation: Number((b.heading + 90 + (i - (n - 1) / 2) * 8).toFixed(1)),
      };
    });
  }
  return out;
}

/* ---------- deterministic label placement ----------
   A tiny greedy pass: for every label try eight candidate slots
   around its marker and take the first one that clears other
   labels, every marker and the fixed geography text. Pure
   function of the inputs — no measurement, no randomness. */

export type LabelAnchor = 'start' | 'end' | 'middle';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelSlot {
  dx: number;
  dy: number;
  anchor: LabelAnchor;
}

export interface LabelPlacement {
  x: number;
  y: number;
  anchor: LabelAnchor;
  box: Rect;
}

const LABEL_SLOTS: LabelSlot[] = [
  { dx: 11, dy: 3, anchor: 'start' },
  { dx: -11, dy: 3, anchor: 'end' },
  { dx: 11, dy: -8, anchor: 'start' },
  { dx: -11, dy: -8, anchor: 'end' },
  { dx: 0, dy: 18, anchor: 'middle' },
  { dx: 0, dy: -13, anchor: 'middle' },
  { dx: 13, dy: 15, anchor: 'start' },
  { dx: -13, dy: 15, anchor: 'end' },
  { dx: 17, dy: -15, anchor: 'start' },
  { dx: -17, dy: -15, anchor: 'end' },
  { dx: 17, dy: 21, anchor: 'start' },
  { dx: -17, dy: 21, anchor: 'end' },
  { dx: 0, dy: 28, anchor: 'middle' },
  { dx: 0, dy: -23, anchor: 'middle' },
];

export interface LabelRequest {
  id: string;
  x: number;
  y: number;
  text: string;
  /** font size used only to estimate the box width */
  fontSize: number;
  /** box height (a two-line label is taller) */
  height: number;
  /** placement priority — lower is placed first */
  order: number;
  /** exclusion radius around this request's own marker */
  markerRadius: number;
  /** measured width, when the label is wider than the single-line estimate */
  width?: number;
}

/** rough advance width for uppercase letter-spaced label text */
export function estimateTextWidth(text: string, fontSize: number, letterSpacing = 0): number {
  return Math.round(text.length * (fontSize * 0.68 + letterSpacing) + 3);
}

function boxFor(x: number, y: number, w: number, h: number, slot: LabelSlot): Rect {
  const left =
    slot.anchor === 'start' ? x + slot.dx : slot.anchor === 'end' ? x + slot.dx - w : x + slot.dx - w / 2;
  return { x: left, y: y + slot.dy - h + 2, w, h };
}

function overlaps(a: Rect, b: Rect, pad = 3): boolean {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  );
}

function boxHitsCircle(box: Rect, cx: number, cy: number, r: number): boolean {
  const nx = Math.max(box.x, Math.min(cx, box.x + box.w));
  const ny = Math.max(box.y, Math.min(cy, box.y + box.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function layoutLabels(
  requests: LabelRequest[],
  blockers: Rect[]
): Record<string, LabelPlacement> {
  const placedRects: Rect[] = [...blockers];
  const markers = requests.map((r) => ({ id: r.id, x: r.x, y: r.y, r: r.markerRadius }));
  const out: Record<string, LabelPlacement> = {};

  const ordered = [...requests].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  /** how badly a candidate box collides with everything already placed */
  const penalty = (box: Rect, self: string): number => {
    let score = 0;
    for (const r of placedRects) {
      const ox = Math.min(box.x + box.w, r.x + r.w) - Math.max(box.x, r.x);
      const oy = Math.min(box.y + box.h, r.y + r.h) - Math.max(box.y, r.y);
      if (ox > 0 && oy > 0) score += ox * oy * 4;
    }
    for (const m of markers) {
      if (m.id === self) continue;
      const nx = Math.max(box.x, Math.min(m.x, box.x + box.w));
      const ny = Math.max(box.y, Math.min(m.y, box.y + box.h));
      const d = Math.hypot(m.x - nx, m.y - ny);
      if (d < m.r) score += (m.r - d) * (m.r - d) * 60;
    }
    return score;
  };

  for (const req of ordered) {
    const w = req.width ?? estimateTextWidth(req.text, req.fontSize);
    let chosen: LabelPlacement | null = null;
    let bestFallback: { slot: LabelSlot; box: Rect; score: number } | null = null;

    for (const slot of LABEL_SLOTS) {
      const box = boxFor(req.x, req.y, w, req.height, slot);
      if (box.x < 3 || box.y < 3 || box.x + box.w > VIEW_W - 3 || box.y + box.h > VIEW_H - 3) continue;

      const score = penalty(box, req.id);
      if (score === 0) {
        chosen = { x: box.x, y: box.y + req.height - 2, anchor: slot.anchor, box };
        break;
      }
      if (!bestFallback || score < bestFallback.score) bestFallback = { slot, box, score };
    }

    if (!chosen && bestFallback) {
      const { slot, box } = bestFallback;
      chosen = { x: box.x, y: box.y + req.height - 2, anchor: slot.anchor, box };
    }
    if (!chosen) {
      // nothing fitted — this should not happen with the hardcoded demo data
      const box = boxFor(req.x, req.y, w, req.height, LABEL_SLOTS[0]);
      chosen = { x: box.x, y: box.y + req.height - 2, anchor: LABEL_SLOTS[0].anchor, box };
    }

    placedRects.push(chosen.box);
    out[req.id] = chosen;
  }
  return out;
}

/* ---------- great-circle distance (Haversine) ---------- */

const R = 6371; // mean Earth radius, km

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(a))));
}

/* ---------- geography ----------
   Simplified [lng, lat] polylines traced once and projected with
   the same `project()` used for the fleet, so silhouettes and
   markers always line up. Deliberately low detail, but the shape
   is real: Kashmir, the Himalayan arc, the north-east arm, the
   Gujarat coast and the peninsular taper are all recognisable. */

export type GeoLine = [number, number][];

/** India — clockwise from the northern tip */
export const INDIA_OUTLINE: GeoLine = [
  // Kashmir & Ladakh
  [76.6, 35.5], [78.0, 35.4], [79.1, 34.5], [78.6, 33.4], [79.4, 33.0], [78.9, 32.3], [79.1, 31.3],
  // Uttarakhand → India–Nepal border
  [80.2, 30.5], [80.1, 28.8], [81.0, 28.4], [81.9, 28.0], [82.7, 27.7], [83.6, 27.5], [84.4, 27.3],
  [85.2, 27.0], [86.0, 26.7], [86.8, 26.6], [87.5, 26.4], [88.1, 26.4],
  // Sikkim
  [88.4, 27.1], [88.9, 27.0],
  // Bhutan
  [89.6, 26.8], [90.7, 26.9], [91.9, 26.9],
  // Arunachal Pradesh
  [92.3, 27.6], [93.4, 27.9], [94.6, 28.2], [95.6, 28.2], [96.4, 28.6], [97.2, 28.3], [96.9, 27.5],
  // Myanmar border — Nagaland, Manipur, Mizoram
  [96.3, 26.9], [95.7, 26.5], [95.1, 26.0], [95.0, 25.0], [94.6, 24.2], [94.2, 23.7], [93.4, 24.0],
  [93.3, 23.0], [92.7, 22.9], [92.5, 21.9],
  // Bangladesh border — Tripura, Meghalaya
  [91.9, 22.6], [91.3, 23.1], [91.1, 23.5], [91.4, 24.0], [91.6, 24.5], [91.1, 25.0], [90.4, 25.1],
  [89.8, 25.3], [89.6, 25.9], [89.0, 26.2],
  // Siliguri corridor → West Bengal
  [88.5, 26.3], [88.4, 26.6], [88.0, 26.0], [88.6, 25.0], [88.3, 24.5], [88.8, 24.1], [88.5, 23.5],
  [88.9, 23.1], [88.6, 22.7], [88.9, 22.2], [88.7, 21.8],
  // Bay of Bengal coast → Chennai
  [88.1, 21.6], [87.0, 21.5], [86.5, 20.7], [85.9, 20.4], [85.1, 19.9], [84.4, 19.4], [83.5, 18.5],
  [82.6, 17.4], [81.8, 16.6], [80.9, 15.9], [80.4, 14.6], [80.2, 13.7], [80.3, 12.8], [79.9, 12.0],
  [79.9, 10.9], [79.5, 10.1], [78.8, 9.2], [78.2, 8.6], [77.6, 8.2],
  // west coast — Kanyakumari → Konkan
  [77.1, 8.6], [76.6, 9.4], [76.2, 10.3], [75.7, 11.4], [75.2, 12.4], [74.7, 13.5], [74.4, 14.6],
  [74.1, 15.5], [73.7, 16.4], [73.3, 17.6], [72.9, 18.9], [72.8, 19.8], [72.7, 20.6], [72.7, 21.1],
  // Saurashtra
  [72.3, 21.3], [71.6, 20.9], [70.8, 20.8], [70.1, 21.0], [69.5, 21.6], [69.2, 22.1],
  // Kutch & the Rann
  [69.6, 22.6], [70.0, 22.9], [70.4, 23.2], [70.1, 23.6], [69.4, 23.4], [68.9, 23.7], [68.3, 23.8],
  [68.2, 24.2], [68.8, 24.3],
  // Rajasthan → Punjab (Pakistan border)
  [69.9, 24.4], [70.6, 25.1], [70.5, 26.0], [71.0, 26.7], [71.6, 27.6], [72.4, 28.0], [72.9, 28.6],
  [73.4, 29.7], [74.0, 30.4], [74.5, 31.1], [74.4, 31.9], [74.6, 32.5], [74.2, 33.4], [74.4, 34.4],
  // back to the northern tip
  [75.4, 34.7], [76.6, 35.5],
];

/** neighbouring landmass — one soft background mass, no borders */
export const NEIGHBOR_LAND: GeoLine[] = [
  // Pakistan, Afghanistan, Iran (west / north-west)
  [
    [66.5, 37.5], [76.6, 35.5], [75.4, 34.7], [74.4, 34.4], [74.2, 33.4], [74.6, 32.5], [74.4, 31.9],
    [74.5, 31.1], [74.0, 30.4], [73.4, 29.7], [72.9, 28.6], [72.4, 28.0], [71.6, 27.6], [71.0, 26.7],
    [70.5, 26.0], [70.6, 25.1], [69.9, 24.4], [68.8, 24.3], [68.2, 24.2], [66.5, 24.0],
  ],
  // China / Tibet / Nepal (north)
  [
    [76.6, 35.5], [78.0, 35.4], [79.1, 34.5], [78.6, 33.4], [79.4, 33.0], [78.9, 32.3], [79.1, 31.3],
    [80.2, 30.5], [80.1, 28.8], [81.0, 28.4], [81.9, 28.0], [82.7, 27.7], [83.6, 27.5], [84.4, 27.3],
    [85.2, 27.0], [86.0, 26.7], [86.8, 26.6], [87.5, 26.4], [88.1, 26.4], [88.4, 27.1], [88.9, 27.0],
    [89.6, 26.8], [90.7, 26.9], [91.9, 26.9], [92.3, 27.6], [93.4, 27.9], [94.6, 28.2], [95.6, 28.2],
    [96.4, 28.6], [97.2, 28.3], [98.5, 28.6], [98.5, 37.5], [66.5, 37.5],
  ],
  // Myanmar and beyond (east)
  [
    [97.2, 28.3], [96.9, 27.5], [96.3, 26.9], [95.7, 26.5], [95.1, 26.0], [95.0, 25.0], [94.6, 24.2],
    [94.2, 23.7], [93.4, 24.0], [93.3, 23.0], [92.7, 22.9], [92.5, 21.9], [93.0, 20.0], [98.5, 19.5],
    [98.5, 28.6],
  ],
];

/** Bangladesh */
export const BANGLADESH_LAND: GeoLine = [
  [89.0, 26.2], [89.6, 25.9], [89.8, 25.3], [90.4, 25.1], [91.1, 25.0], [91.6, 24.5], [91.4, 24.0],
  [91.1, 23.5], [91.3, 23.1], [91.9, 22.6], [92.5, 21.9], [91.0, 22.0], [90.3, 21.8], [89.6, 21.7],
  [88.9, 21.7], [88.6, 22.1], [88.9, 22.4], [88.6, 22.8], [88.9, 23.2], [88.5, 23.6], [88.8, 24.1],
  [88.3, 24.5], [88.6, 25.0], [88.0, 26.0],
];

/** Sri Lanka */
export const SRI_LANKA_LAND: GeoLine = [
  [80.0, 9.8], [81.2, 9.3], [81.8, 8.4], [81.7, 7.2], [81.4, 6.4], [80.6, 6.0], [80.0, 6.6],
  [79.8, 7.6], [79.9, 8.5],
];

/** Andaman & Nicobar — a small chain, enough to read as islands */
export const ISLANDS: { lat: number; lng: number; r: number }[] = [
  { lat: 13.4, lng: 93.0, r: 2.6 },
  { lat: 12.4, lng: 92.9, r: 3.2 },
  { lat: 11.6, lng: 92.7, r: 2.8 },
  { lat: 10.7, lng: 92.6, r: 2.2 },
  { lat: 8.0, lng: 93.6, r: 2.0 },
  { lat: 7.2, lng: 93.7, r: 1.7 },
];

/** rivers — a handful of thin lines that make the plate read as real */
export const RIVERS: GeoLine[] = [
  // Ganga
  [[78.2, 30.1], [79.6, 28.6], [80.9, 27.0], [82.0, 26.2], [83.6, 25.6], [85.1, 25.6], [86.6, 25.3],
   [87.6, 24.7], [88.4, 23.6], [88.6, 22.6], [88.4, 21.8]],
  // Brahmaputra
  [[95.4, 27.9], [94.4, 26.9], [92.9, 26.4], [91.5, 26.2], [90.2, 26.0], [89.7, 25.6], [89.9, 24.6],
   [90.5, 24.0], [90.6, 23.2], [90.2, 22.4]],
  // Narmada
  [[81.3, 22.8], [79.5, 22.3], [77.6, 22.0], [75.8, 21.9], [74.2, 21.7], [73.2, 21.5]],
  // Godavari
  [[73.6, 20.0], [75.3, 19.6], [77.0, 19.2], [78.8, 18.9], [80.2, 18.6], [81.5, 17.9], [82.2, 17.3]],
  // Krishna
  [[73.9, 17.7], [75.4, 17.2], [76.9, 16.7], [78.4, 16.5], [79.6, 16.2], [80.6, 15.9]],
  // Mahanadi
  [[81.0, 20.6], [82.4, 20.4], [83.6, 20.8], [84.9, 20.4], [86.0, 20.3]],
];

/** ridge lines behind the Himalaya and the Western Ghats */
export const RIDGES: GeoLine[] = [
  [[74.6, 33.6], [76.4, 34.7], [78.4, 34.4], [79.6, 32.8], [81.0, 30.9], [82.6, 29.2], [84.2, 28.4],
   [85.8, 27.7], [87.4, 27.1], [89.0, 26.8], [90.6, 26.8], [92.2, 27.1], [93.8, 27.4], [95.4, 27.5]],
  [[75.2, 32.9], [76.8, 33.9], [78.7, 33.5], [79.9, 31.9], [81.3, 30.1], [82.9, 28.5], [84.5, 27.7],
   [86.1, 27.0], [87.7, 26.5], [89.3, 26.3], [90.9, 26.4], [92.5, 26.7], [94.1, 27.0], [95.6, 27.1]],
  [[75.9, 32.2], [77.4, 33.1], [79.2, 32.6], [80.4, 31.0], [81.8, 29.3], [83.4, 27.9], [85.0, 27.1],
   [86.6, 26.5], [88.2, 26.0], [89.8, 25.9], [91.4, 26.1], [93.0, 26.4], [94.6, 26.7], [95.9, 26.8]],
  // Western Ghats
  [[73.4, 20.4], [74.2, 18.5], [74.7, 16.5], [75.2, 14.5], [75.7, 12.5], [76.4, 10.6], [77.2, 9.2]],
  [[74.0, 20.6], [74.8, 18.7], [75.3, 16.7], [75.9, 14.7], [76.5, 12.7], [77.2, 10.8], [78.0, 9.4]],
];

/** arid western belt — soft sand wash */
export const THAR_LAND: GeoLine = [
  [69.6, 23.2], [70.2, 24.4], [70.9, 26.0], [71.8, 27.5], [73.0, 27.9], [73.5, 27.0], [73.0, 25.5],
  [72.0, 24.0], [70.9, 23.1],
];

export const SEA_LABELS: { name: string; lat: number; lng: number; size: number }[] = [
  { name: 'ARABIAN SEA', lat: 15.5, lng: 68.6, size: 11 },
  { name: 'BAY OF BENGAL', lat: 14.2, lng: 87.6, size: 11 },
  { name: 'INDIAN OCEAN', lat: 8.5, lng: 74.0, size: 11 },
];

export const COUNTRY_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: 'PAKISTAN', lat: 30.4, lng: 70.4 },
  { name: 'NEPAL', lat: 28.6, lng: 84.2 },
  { name: 'BHUTAN', lat: 27.7, lng: 90.4 },
  { name: 'MYANMAR', lat: 25.4, lng: 96.4 },
  { name: 'BANGLADESH', lat: 23.5, lng: 90.3 },
  { name: 'SRI LANKA', lat: 7.8, lng: 81.6 },
];

export const CITY_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: 'MUMBAI', lat: 19.08, lng: 72.88 },
  { name: 'CHENNAI', lat: 13.08, lng: 80.27 },
  { name: 'KOLKATA', lat: 22.57, lng: 88.36 },
];

/** Build an SVG path string from a [lng, lat] polyline. */
export function regionPath(line: GeoLine, close = true): string {
  const pts = line.map(([lng, lat]) => {
    const p = project(lat, lng);
    return `${p.x} ${p.y}`;
  });
  return `M${pts.join(' L')}${close ? ' Z' : ''}`;
}

/* ---------- status grouping ---------- */

export type MapFilter = 'all' | 'ready' | 'restricted' | 'critical' | 'maintenance';

export const MAP_FILTERS: { key: MapFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ready', label: 'Ready' },
  { key: 'restricted', label: 'Restricted' },
  { key: 'critical', label: 'Critical' },
  { key: 'maintenance', label: 'Maintenance' },
];

/** Map a fleet status onto the four command categories. */
export function mapCategory(status: AircraftStatus): Exclude<MapFilter, 'all'> {
  if (status === 'grounded' || status === 'critical') return 'critical';
  if (status === 'maintenance') return 'maintenance';
  if (status === 'warning') return 'restricted';
  return 'ready';
}

export const CATEGORY_STYLE: Record<
  Exclude<MapFilter, 'all'>,
  { label: string; fill: string; text: string }
> = {
  ready: { label: 'Ready', fill: '#22C55E', text: 'text-ok' },
  restricted: { label: 'Restricted', fill: '#F59E0B', text: 'text-warn' },
  critical: { label: 'Critical', fill: '#EF4444', text: 'text-bad' },
  maintenance: { label: 'Maintenance', fill: '#3B82F6', text: 'text-navy' },
};

/* ---------- per-base rollup ---------- */

export interface BaseRollup {
  base: BaseLocation;
  total: number;
  ready: number;
  restricted: number;
  critical: number;
  maintenance: number;
  aircraftIds: string[];
}

export function rollupByBase(
  fleet: Aircraft[],
  positions: Record<string, AircraftPosition>
): Record<string, BaseRollup> {
  const out: Record<string, BaseRollup> = {};
  for (const b of BASE_LOCATIONS) {
    out[b.id] = {
      base: b,
      total: 0,
      ready: 0,
      restricted: 0,
      critical: 0,
      maintenance: 0,
      aircraftIds: [],
    };
  }
  for (const a of fleet) {
    const pos = positions[a.id];
    if (!pos) continue;
    const row = out[pos.baseId];
    if (!row) continue;
    row.total += 1;
    row.aircraftIds.push(a.id);
    const cat = mapCategory(a.status);
    if (cat === 'ready') row.ready += 1;
    else row[cat] += 1;
  }
  for (const row of Object.values(out)) row.aircraftIds.sort();
  return out;
}

export function fleetCounts(fleet: Aircraft[]) {
  const c = { ready: 0, restricted: 0, critical: 0, maintenance: 0 };
  for (const a of fleet) c[mapCategory(a.status)] += 1;
  return c;
}
