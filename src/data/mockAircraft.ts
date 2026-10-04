import type { Aircraft, ComponentHealthMap } from '@/data/types';
import { computeHealth } from '@/utils/healthCalculator';

/* ============================================================
   Mock fleet — 20 aircraft based on NASA CMAPSS-style patterns
   ============================================================ */

type Seed = Omit<Aircraft, 'healthScore'> & { components: Aircraft['components'] };

function mk(
  id: string,
  name: string,
  type: Aircraft['type'],
  status: Aircraft['status'],
  lastMaintenance: string,
  flightHours: number,
  engineCycles: number,
  squadron: string,
  base: string,
  engine: number,
  hydraulic: number,
  avionics: number,
  landingGear: number,
  fuelSystem: number
): Aircraft {
  const components: ComponentHealthMap = { engine, hydraulic, avionics, landingGear, fuelSystem };
  return {
    id,
    name,
    type,
    status,
    lastMaintenance,
    flightHours,
    engineCycles,
    squadron,
    base,
    components,
    healthScore: computeHealth(components),
  };
}

export const MOCK_AIRCRAFT: Aircraft[] = [
  mk('AC-001', 'Tejas LCA', 'Fighter', 'operational', '2026-09-12', 1240, 890, 'No. 45 Sqn', 'AF Stn Sulur', 88, 91, 85, 93, 90),
  mk('AC-002', 'Su-30 MKI', 'Fighter', 'operational', '2026-08-28', 2140, 1520, 'No. 2 Sqn', 'AF Stn Tezpur', 84, 78, 62, 88, 86),
  mk('AC-003', 'MiG-21 Bison', 'Fighter', 'maintenance', '2026-09-30', 3180, 2410, 'No. 4 Sqn', 'AF Stn Nal', 70, 74, 80, 72, 78),
  mk('AC-004', 'Mirage 2000', 'Fighter', 'operational', '2026-09-02', 2760, 1980, 'No. 7 Sqn', 'AF Stn Gwalior', 86, 83, 79, 68, 88),
  mk('AC-005', 'Rafale', 'Fighter', 'operational', '2026-09-18', 980, 640, 'No. 17 Sqn', 'AF Stn Ambala', 66, 88, 90, 92, 89),
  mk('AC-006', 'Jaguar MK2', 'Fighter', 'operational', '2026-08-20', 3320, 2540, 'No. 14 Sqn', 'AF Stn Ambala', 82, 85, 77, 81, 84),
  mk('AC-007', 'Jaguar MK2', 'Fighter', 'warning', '2026-07-15', 3560, 2715, 'No. 14 Sqn', 'AF Stn Ambala', 78, 52, 84, 80, 82),
  mk('AC-008', 'MiG-29 UPG', 'Fighter', 'operational', '2026-09-08', 2260, 1690, 'No. 28 Sqn', 'AF Stn Adampur', 87, 84, 83, 89, 86),
  mk('AC-009', 'Hawk MK132', 'Fighter', 'maintenance', '2026-10-01', 1580, 1120, 'No. 2 FTS', 'AF Stn Bidar', 74, 70, 76, 66, 80),
  mk('AC-010', 'C-17 Globemaster III', 'Transport', 'operational', '2026-09-22', 4210, 1180, 'No. 81 Sqn', 'AF Stn Hindan', 90, 88, 86, 84, 92),
  mk('AC-011', 'IL-76 Gajraj', 'Transport', 'operational', '2026-08-30', 5840, 1740, 'No. 44 Sqn', 'AF Stn Agra', 80, 76, 72, 58, 78),
  mk('AC-012', 'Su-30 MKI', 'Fighter', 'critical', '2026-06-25', 2480, 1810, 'No. 2 Sqn', 'AF Stn Tezpur', 34, 48, 60, 70, 42),
  mk('AC-013', 'AN-32', 'Transport', 'operational', '2026-09-05', 6120, 2260, 'No. 33 Sqn', 'AF Stn Jorhat', 76, 79, 74, 77, 72),
  mk('AC-014', 'C-130J Super Hercules', 'Transport', 'maintenance', '2026-09-28', 3480, 990, 'No. 77 Sqn', 'AF Stn Hindan', 68, 80, 82, 75, 77),
  mk('AC-015', 'HAL Dhruv', 'Helicopter', 'operational', '2026-10-02', 1620, 2140, 'No. 151 HelU', 'AF Stn Leh', 85, 82, 80, 86, 84),
  mk('AC-016', 'Apache AH-64E', 'Helicopter', 'grounded', '2026-07-08', 1140, 1560, 'No. 125 HelU', 'AF Stn Pathankot', 40, 50, 62, 38, 36),
  mk('AC-017', 'CH-47 Chinook', 'Helicopter', 'operational', '2026-09-15', 980, 1240, 'No. 126 HelU', 'AF Stn Chandigarh', 88, 90, 84, 87, 86),
  mk('AC-018', 'HAL Prachand', 'Helicopter', 'operational', '2026-08-25', 420, 560, 'No. 151 HelU', 'AF Stn Leh', 79, 81, 58, 83, 80),
  mk('AC-019', 'MiG-21 Bison', 'Fighter', 'maintenance', '2026-09-26', 3290, 2520, 'No. 4 Sqn', 'AF Stn Nal', 66, 72, 70, 68, 74),
  mk('AC-020', 'Tejas MK1A', 'Fighter', 'operational', '2026-09-20', 310, 210, 'No. 45 Sqn', 'AF Stn Sulur', 83, 80, 88, 85, 52),
];

export function getAircraftById(id: string): Aircraft | undefined {
  return MOCK_AIRCRAFT.find((a) => a.id === id);
}
