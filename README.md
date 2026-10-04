<div align="center">

# Vayu Sewa

**AI/ML-driven predictive maintenance & fleet availability platform for military airframes**

Built for SIH problem statement **26249 — _Air Power: Predictive Maintenance & Fleet Availability_**
(Ministry of Defence · Defence Services Staff College · Transportation & Logistics)

`Next.js 16` `React 19` `TypeScript` `Tailwind CSS 4` `shadcn/ui` `Recharts` `jsPDF` `Fuse.js`

</div>

---

## The problem

> Low aircraft availability due to fragmented and largely reactive maintenance practices
> across the air fleet. Maintenance data from aircraft health-monitoring systems, technical
> records, spares and maintenance agencies is not adequately integrated, resulting in delayed
> fault prediction, avoidable aircraft downtime and sub-optimal utilisation of critical assets.

Vayu Sewa attacks the *fragmentation* half of that statement. It puts airframe health,
sensor telemetry, technical records, work orders, spares and procurement into a single
console so a degrading component becomes a scheduled work order with parts already
reserved — before it grounds an aircraft.

---

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

| Role | User ID | Password |
| --- | --- | --- |
| Commander | `commander` | `demo123` |
| Engineer | `engineer` | `demo123` |
| Logistics | `logistics` | `demo123` |

> Requires Node.js 20+. Everything is client-side mock data — no API keys, no database,
> no network calls.

---

## What's in it

**20 airframes** across fighters, transports and helicopters, each with a five-component
health map (engine · hydraulic · avionics · landing gear · fuel system).

### Live telemetry & fault detection
- 2-second sensor tick across 4 channels (engine temp, vibration, oil pressure, fuel flow)
- Readings are generated from CMAPSS-style degradation envelopes with realistic anomaly spikes
- **3 consecutive out-of-range readings → automatic fault prediction + notification**
- 10-minute per-component cooldown so the anomaly engine can't spam predictions
- Weighted health score recalculated every tick; components degrade under stress and recover slowly

### Three role dashboards (21 routes)
- **Commander** — fleet overview, status map, mission readiness, alerts, reports
- **Engineer** — health grid, per-aircraft detail (sensors / predictions / work orders / history / digital twin), live sensors, fault predictions, kanban work orders, maintenance history, AI recommendations, crew workload
- **Logistics** — inventory overview, parts inventory, upcoming demand, procurement alerts, procurement tracking, parts analytics, reports

### Cross-linked sustainment chain
The part that addresses "not adequately integrated": creating a work order triggers a
**stock check**, which auto-raises a **procurement order** and fires a **notification** —
so parts availability is resolved at the moment maintenance is scheduled, not after.

### Airframe health map
Blueprint-style top-down SVG with five colour-coded, clickable component zones:

| Health | Colour | Status |
| --- | --- | --- |
| > 80% | Green | Normal |
| 50–80% | Amber | Attention Required |
| < 50% | Red | Critical — Fault Predicted |

Critical zones pulse with a glowing blur; hovering shows live component health; clicking
flashes the matching row in the component health list.

### Also included
- **Digital twin** — SVG airframe with clickable fault zones and live component readouts
- **Global search** — `Ctrl`/`Cmd` + `K`, Fuse.js fuzzy search across aircraft, predictions, work orders and parts
- **6 PDF reports + CSV export** — jsPDF, navy branding, page numbers, "Restricted: For official use only" footer
- **Role-based access control** — routes redirect users who don't hold the role
- Skeletons, empty states, tooltips and responsive layout throughout

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix primitives |
| Charts | Recharts |
| PDF | jsPDF |
| Search | Fuse.js |
| Routing | react-router-dom (HashRouter, SPA-style) |
| Language | TypeScript (strict) |

---

## Project structure

```
src/
├── app/                  # Next.js entry: layout, page, /api route
├── components/
│   ├── charts/           # 6 Recharts visualisations
│   ├── digital-twin/     # SVG airframe + component panel
│   ├── layout/           # Navbar, Sidebar, GlobalSearch, NotificationsPanel
│   ├── shared/           # AircraftHealthMap, AircraftSlideOver, badges, tables
│   └── ui/               # shadcn/ui primitives
├── context/              # AuthContext, DataContext, SensorContext
├── data/                 # Mock fleet, predictions, work orders, parts, crew, ops
├── utils/                # sensorSimulator, healthCalculator, pdfGenerator,
│                         # searchIndex, selectors, helpers
└── views/                # 21 page components, grouped by role
```

> **Note on `views/`:** these live in `src/views/`, not `src/pages/`. `src/pages/` is a
> reserved Next.js directory — putting components there makes Next activate the Pages
> Router and try to prerender every screen as a route, which fails because they depend on
> React context providers.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3000 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

### About the Prisma scripts

`prisma/` and `src/lib/db.ts` are **scaffolded but not yet wired in** — they define the
intended persistence layer for a future backend. The current build runs entirely on
in-memory mock data plus `localStorage` for the auth session, so nothing imports
`src/lib/db.ts` yet. `DATABASE_URL` is only needed if you run the `db:*` scripts:

```bash
cp .env.example .env
npm run db:generate
npm run db:push
```

---

## Deployment

The included `Caddyfile` reverse-proxies port 3000, so the app is designed to sit behind
a TLS-terminating proxy:

```bash
npm run build && npm start
```

---

## Current limitations

Honest list of what's demo-grade rather than production-grade:

- **No trained ML model yet.** Fault confidence is currently heuristic (`52 + random*20`).
  This is the single biggest gap against the PS wording "AI/ML-based predictive maintenance"
  and the top priority for the next iteration.
- **Mock data, not a backend.** No persistence beyond `localStorage`; a real deployment
  needs the Prisma layer connected and an auth provider replacing the mock JWT.
- **Data integration is partial.** Health, work orders and parts are cross-linked, but
  technical records (`mockHistory`) are generated independently and don't yet react to
  live state.
- **No test suite.**
- The digital twin mirrors live readings but does not yet simulate thermodynamics.

---

## License

MIT — see [LICENSE](LICENSE).
