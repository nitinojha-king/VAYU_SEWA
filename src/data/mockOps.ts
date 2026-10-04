import type { ProcurementOrder, FleetTrendPoint, Recommendation } from '@/data/types';
import { daysAgo, daysFromNow } from '@/utils/helpers';

/* ============================================================
   Procurement orders
   ============================================================ */

export const MOCK_PROCUREMENT: ProcurementOrder[] = [
  {
    id: 'PO-1101',
    partId: 'HYD-2241',
    partName: 'Hydraulic Pump Seal',
    quantity: 10,
    status: 'raised',
    raisedOn: daysAgo(1),
    orderedOn: null,
    expectedDelivery: daysFromNow(6),
    supplier: 'Hydraulic Systems Ltd, Bengaluru',
    unitCost: 45000,
    aircraftId: 'AC-007',
    workOrderId: 'WO-0023',
    urgency: 'critical',
  },
  {
    id: 'PO-1102',
    partId: 'BRK-0091',
    partName: 'Wheel Brake Pad Set',
    quantity: 8,
    status: 'approved',
    raisedOn: daysAgo(2),
    orderedOn: null,
    expectedDelivery: daysFromNow(8),
    supplier: 'Brake Dynamics Pvt Ltd, Pune',
    unitCost: 47000,
    aircraftId: 'AC-004',
    workOrderId: 'WO-0031',
    urgency: 'warning',
  },
  {
    id: 'PO-1103',
    partId: 'FUE-2210',
    partName: 'Fuel Pump Assembly',
    quantity: 6,
    status: 'ordered',
    raisedOn: daysAgo(4),
    orderedOn: daysAgo(2),
    expectedDelivery: daysFromNow(4),
    supplier: 'AeroFuel Components, Hyderabad',
    unitCost: 285000,
    aircraftId: 'AC-016',
    workOrderId: 'WO-0025',
    urgency: 'critical',
  },
  {
    id: 'PO-1104',
    partId: 'TYRE-MAIN',
    partName: 'Main Wheel Tyre (AR-500)',
    quantity: 10,
    status: 'in-transit',
    raisedOn: daysAgo(8),
    orderedOn: daysAgo(6),
    expectedDelivery: daysFromNow(2),
    supplier: 'TyreCorp Aero, Chennai',
    unitCost: 38000,
    urgency: 'warning',
  },
  {
    id: 'PO-1105',
    partId: 'AVN-0331',
    partName: 'Radar Transceiver Module',
    quantity: 4,
    status: 'received',
    raisedOn: daysAgo(14),
    orderedOn: daysAgo(11),
    expectedDelivery: daysAgo(2),
    supplier: 'Avionix Labs, Bengaluru',
    unitCost: 340000,
    aircraftId: 'AC-002',
    workOrderId: 'WO-0026',
    urgency: 'warning',
  },
];

/* ============================================================
   Fleet health trend — last 30 days (current 72, peak 89, low 61)
   ============================================================ */

function buildTrend(): FleetTrendPoint[] {
  const shape = [
    84, 83, 84, 85, 86, 86, 87, 89, 88, 86, 84, 82, 79, 76, 73, 70, 67, 64, 62, 61,
    62, 64, 65, 67, 68, 70, 70, 71, 71, 72,
  ];
  const out: FleetTrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push({
      date: `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
      health: shape[29 - i],
    });
  }
  return out;
}

export const FLEET_TREND: FleetTrendPoint[] = buildTrend();

/* ============================================================
   Parts consumption analytics
   ============================================================ */

export const TOP_USED_PARTS = [
  { part: 'Aero Engine Oil 15W/50', usage: 142 },
  { part: 'Engine Oil Filter Element', usage: 118 },
  { part: 'Main Wheel Tyre (AR-500)', usage: 96 },
  { part: 'Hydraulic Fluid MIL-PRF-5606', usage: 88 },
  { part: 'Igniter Plug (Turbojet)', usage: 74 },
  { part: 'Wheel Brake Pad Set', usage: 65 },
  { part: 'Hydraulic O-Ring Seal Kit', usage: 58 },
  { part: 'Fuel Nozzle Set', usage: 47 },
  { part: 'Radar Transceiver Module', usage: 39 },
  { part: 'Nose Wheel Assembly', usage: 33 },
];

export const MONTHLY_COST = [
  { month: 'May', cost: 1840000 },
  { month: 'Jun', cost: 2120000 },
  { month: 'Jul', cost: 1965000 },
  { month: 'Aug', cost: 2410000 },
  { month: 'Sep', cost: 2280000 },
  { month: 'Oct', cost: 2650000 },
];

/* ============================================================
   AI maintenance recommendations
   ============================================================ */

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'REC-001',
    aircraftId: 'AC-007',
    component: 'Hydraulic Pump',
    componentKey: 'hydraulic',
    recommendation: 'Inspect hydraulic seals immediately and replace pump seal kit',
    rationale:
      'Vibration pattern in the last 40 flight hours matches pre-failure signature H-22 in the training dataset (91% pattern match). Oil pressure decay of 0.4 psi/hr corroborates seal degradation.',
    riskIfIgnored: 'Potential hydraulic failure in ~18 hrs causing 72 hr downtime and grounding during exercise window',
    actNow: { downtimeHours: 4, partsNeeded: 1 },
    wait: { downtimeHours: 72, partsNeeded: 3, missionImpact: 'AC-007 unavailable for 10-day readiness cycle' },
    predictionId: 'FP-001',
  },
  {
    id: 'REC-002',
    aircraftId: 'AC-012',
    component: 'Engine Fuel Nozzle',
    componentKey: 'engine',
    recommendation: 'Replace fuel nozzle set and perform hot-section borescope check',
    rationale:
      'Exhaust gas temperature margin has narrowed 22% faster than fleet norm; fuel-flow variance (σ = 18 kg/h) matches nozzle coking signature N-07.',
    riskIfIgnored: 'Probable engine flameout risk in ~9 hrs; uncontained EGT exceedance could add 120 hr depot repair',
    actNow: { downtimeHours: 6, partsNeeded: 1 },
    wait: { downtimeHours: 120, partsNeeded: 4, missionImpact: 'Sqn readiness drops below minimum sortie rate' },
    predictionId: 'FP-002',
  },
  {
    id: 'REC-003',
    aircraftId: 'AC-016',
    component: 'Fuel Pump Assembly',
    componentKey: 'fuelSystem',
    recommendation: 'Replace main fuel pump before next ground-run cycle',
    rationale:
      'Pump discharge pressure ripple amplitude is 3.1x baseline — signature P-14, historically precedes impeller cracks at this flight-hour band.',
    riskIfIgnored: 'Failure in ~22 hrs; helicopter already grounded — extends grounding by ~48 hrs for AOG part',
    actNow: { downtimeHours: 5, partsNeeded: 1 },
    wait: { downtimeHours: 48, partsNeeded: 2, missionImpact: 'Rotary-wing SAR standby coverage lost' },
    predictionId: 'FP-005',
  },
  {
    id: 'REC-004',
    aircraftId: 'AC-011',
    component: 'Landing Gear Actuator',
    componentKey: 'landingGear',
    recommendation: 'Service landing gear actuator and replace seal kit within 5 days',
    rationale:
      'Retraction cycle time increased 14% over last 20 sorties; hydraulic back-pressure transients match actuator bypass signature G-03.',
    riskIfIgnored: 'Gear-up landing risk escalates after ~120 hrs; emergency extension may be required',
    actNow: { downtimeHours: 4, partsNeeded: 1 },
    wait: { downtimeHours: 96, partsNeeded: 3, missionImpact: 'Transport commitment to Ladakh sector at risk' },
    predictionId: 'FP-004',
  },
  {
    id: 'REC-005',
    aircraftId: 'AC-014',
    component: 'Engine Compressor Blade',
    componentKey: 'engine',
    recommendation: 'Schedule borescope inspection of HP compressor stages 1-3',
    rationale:
      'Vibration spectrum shows a 0.8g sideband at blade-passing frequency — consistent with tip-rub signature C-19 (training set match 84%).',
    riskIfIgnored: 'Blade liberation risk within ~96 hrs would trigger engine removal (240 hr depot job)',
    actNow: { downtimeHours: 5, partsNeeded: 1 },
    wait: { downtimeHours: 240, partsNeeded: 3, missionImpact: 'Strategic airlift slot for NAVY exchange lost' },
    predictionId: 'FP-007',
  },
  {
    id: 'REC-006',
    aircraftId: 'AC-018',
    component: 'Inertial Navigation Unit',
    componentKey: 'avionics',
    recommendation: 'Realign INS unit and push gyroscope firmware patch v4.2',
    rationale:
      'Drift error exceeded 1.7 NM/hr on last 3 sorties — matches software defect report INS-D12 affecting gyro temperature compensation.',
    riskIfIgnored: 'Navigation accuracy degrades below precision-drop criteria in ~216 hrs',
    actNow: { downtimeHours: 2, partsNeeded: 1 },
    wait: { downtimeHours: 24, partsNeeded: 2, missionImpact: 'High-altitude recce missions paused' },
    predictionId: 'FP-008',
  },
];
