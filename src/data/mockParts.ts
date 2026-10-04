import type { SparePart } from '@/data/types';
import { daysAgo } from '@/utils/helpers';

/* ============================================================
   Spare parts inventory — 23 line items
   ============================================================ */

function p(
  partId: string,
  name: string,
  category: SparePart['category'],
  quantity: number,
  minimumRequired: number,
  unitCost: number,
  location: string,
  lastRestockedDaysAgo: number
): SparePart {
  return {
    partId,
    name,
    category,
    quantity,
    minimumRequired,
    unitCost,
    location,
    lastRestocked: daysAgo(lastRestockedDaysAgo),
  };
}

export const MOCK_PARTS: SparePart[] = [
  p('HYD-2241', 'Hydraulic Pump Seal', 'Hydraulic', 0, 5, 45000, 'Bay A - Shelf 3', 45),
  p('SEAL-889', 'Hydraulic O-Ring Seal Kit', 'Hydraulic', 3, 6, 8200, 'Bay A - Shelf 3', 30),
  p('HYD-1108', 'Hydraulic Pressure Line', 'Hydraulic', 4, 5, 61500, 'Bay A - Shelf 4', 38),
  p('ACTU-HYD', 'Hydraulic Actuator Assembly', 'Hydraulic', 9, 3, 128000, 'Bay A - Shelf 1', 21),
  p('HYD-FLD-4', 'Hydraulic Fluid MIL-PRF-5606 (20L)', 'Hydraulic', 48, 20, 5400, 'Bay A - Drum Store', 12),
  p('ENG-0912', 'Compressor Blade Set (Stage 1-3)', 'Engine', 12, 4, 210000, 'Bay B - Shelf 2', 18),
  p('ENG-NGV', 'NGV Blade Ring', 'Engine', 5, 3, 175000, 'Bay B - Shelf 2', 27),
  p('OIL-15W50', 'Aero Engine Oil 15W/50 (20L)', 'Engine', 40, 15, 9800, 'Bay B - Drum Store', 9),
  p('FILT-OIL', 'Engine Oil Filter Element', 'Engine', 22, 8, 6300, 'Bay B - Shelf 5', 15),
  p('FUE-1102', 'Fuel Nozzle Set', 'Engine', 2, 4, 96000, 'Bay B - Shelf 3', 52),
  p('FUE-2210', 'Fuel Pump Assembly', 'Engine', 0, 3, 285000, 'Bay B - Shelf 1', 61),
  p('FUE-3340', 'Fuel Shutoff Valve', 'Engine', 9, 3, 54000, 'Bay B - Shelf 3', 24),
  p('IGN-PLUG', 'Igniter Plug (Turbojet)', 'Engine', 14, 6, 12700, 'Bay B - Shelf 4', 11),
  p('AVN-0331', 'Radar Transceiver Module', 'Avionics', 8, 3, 340000, 'Bay C - ESD Rack 1', 33),
  p('AVN-0778', 'Inertial Navigation Unit', 'Avionics', 6, 2, 520000, 'Bay C - ESD Rack 2', 40),
  p('RADR-TX', 'Radar Transmitter TWT', 'Avionics', 3, 2, 410000, 'Bay C - ESD Rack 1', 47),
  p('MFD-5IN', 'Multi-Function Display 5in', 'Avionics', 2, 1, 295000, 'Bay C - ESD Rack 3', 58),
  p('TYRE-MAIN', 'Main Wheel Tyre (AR-500)', 'Structural', 14, 6, 38000, 'Bay D - Rack 1', 14),
  p('WHEEL-NOSE', 'Nose Wheel Assembly', 'Structural', 6, 3, 52000, 'Bay D - Rack 1', 26),
  p('BRK-0091', 'Wheel Brake Pad Set', 'Structural', 0, 4, 47000, 'Bay D - Rack 2', 49),
  p('CANOPY-AC', 'Aircraft Canopy Panel', 'Structural', 2, 1, 640000, 'Bay D - Rack 4', 70),
  p('ROTOR-BLD', 'Main Rotor Blade (Helicopter)', 'Structural', 10, 4, 890000, 'Bay D - Rack 3', 19),
  p('LGA-0450', 'Landing Gear Actuator Seal Kit', 'Structural', 1, 2, 29500, 'Bay D - Rack 2', 55),
  p('GBOX-TAIL', 'Tail Rotor Gearbox', 'Structural', 1, 2, 760000, 'Bay D - Rack 3', 66),
];
