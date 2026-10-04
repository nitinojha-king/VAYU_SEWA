import type { MaintenanceRecord } from '@/data/types';
import { daysAgo } from '@/utils/helpers';
import { MOCK_AIRCRAFT } from '@/data/mockAircraft';

/* ============================================================
   12 months of maintenance history — deterministically seeded
   ============================================================ */

const TASK_POOL: { task: string; type: MaintenanceRecord['type']; hours: number }[] = [
  { task: 'Scheduled 100-hour service', type: 'Scheduled Service', hours: 8 },
  { task: 'Engine borescope inspection', type: 'Inspection', hours: 3 },
  { task: 'Hydraulic system pressure test', type: 'Inspection', hours: 2.5 },
  { task: 'Avionics software update & BIT run', type: 'Scheduled Service', hours: 4 },
  { task: 'Landing gear retract test', type: 'Inspection', hours: 3.5 },
  { task: 'Brake pad replacement', type: 'Component Replacement', hours: 3 },
  { task: 'Fuel filter & nozzle cleaning', type: 'Repair', hours: 4.5 },
  { task: 'Canopy seal replacement', type: 'Repair', hours: 5 },
  { task: 'Oil & filter change', type: 'Scheduled Service', hours: 2 },
  { task: 'Hydraulic pump seal replacement', type: 'Component Replacement', hours: 4 },
  { task: 'Radar transceiver bench test', type: 'Repair', hours: 6 },
  { task: 'Post-flight inspection', type: 'Inspection', hours: 1.5 },
  { task: 'Engine oil analysis sample', type: 'Scheduled Service', hours: 1 },
  { task: 'Wheel & tyre replacement', type: 'Component Replacement', hours: 2.5 },
];

const CREW_POOL = [
  'Tech Sgt. Kumar',
  'Cpl. R. Nair',
  'Cpl. D. Singh',
  'Sgt. A. Patel',
  'Sgt. M. Khan',
  'Cpl. V. Iyer',
];

/* mulberry32 — tiny deterministic PRNG */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHistory(): MaintenanceRecord[] {
  const records: MaintenanceRecord[] = [];
  let counter = 1;
  MOCK_AIRCRAFT.forEach((ac, ai) => {
    const rand = mulberry32(1000 + ai * 77);
    const count = 5 + Math.floor(rand() * 4); // 5-8 records per aircraft
    const offsets: number[] = [];
    for (let i = 0; i < count; i++) {
      // spread over last 360 days
      offsets.push(Math.floor(15 + (i / count) * 330 + rand() * 20));
    }
    offsets.forEach((daysBack) => {
      const t = TASK_POOL[Math.floor(rand() * TASK_POOL.length)];
      const crew = CREW_POOL[Math.floor(rand() * CREW_POOL.length)];
      records.push({
        id: `MH-${String(counter++).padStart(4, '0')}`,
        aircraftId: ac.id,
        date: daysAgo(daysBack),
        task: t.task,
        crew,
        durationHours: Math.round((t.hours + rand()) * 10) / 10,
        type: t.type,
      });
    });
  });
  // most recent first
  records.sort((a, b) => (a.date < b.date ? 1 : -1));
  return records;
}

export const MOCK_HISTORY: MaintenanceRecord[] = buildHistory();
