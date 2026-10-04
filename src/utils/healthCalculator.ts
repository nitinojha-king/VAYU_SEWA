import type { ComponentHealthMap } from '@/data/types';

/* ============================================================
   Health score calculation
   Weighted: Engine 40% · Hydraulic 20% · Avionics 20% ·
             Landing Gear 10% · Fuel System 10%
   ============================================================ */

export const COMPONENT_WEIGHTS: Record<keyof ComponentHealthMap, number> = {
  engine: 0.4,
  hydraulic: 0.2,
  avionics: 0.2,
  landingGear: 0.1,
  fuelSystem: 0.1,
};

export const COMPONENT_LABELS: Record<keyof ComponentHealthMap, string> = {
  engine: 'Engine',
  hydraulic: 'Hydraulic',
  avionics: 'Avionics',
  landingGear: 'Landing Gear',
  fuelSystem: 'Fuel System',
};

export function computeHealth(c: ComponentHealthMap): number {
  const score =
    c.engine * COMPONENT_WEIGHTS.engine +
    c.hydraulic * COMPONENT_WEIGHTS.hydraulic +
    c.avionics * COMPONENT_WEIGHTS.avionics +
    c.landingGear * COMPONENT_WEIGHTS.landingGear +
    c.fuelSystem * COMPONENT_WEIGHTS.fuelSystem;
  return Math.round(score * 10) / 10;
}

export type HealthBand = 'healthy' | 'warning' | 'critical';

export function healthBand(score: number): HealthBand {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

export function healthColor(score: number): string {
  const band = healthBand(score);
  if (band === 'healthy') return '#22C55E';
  if (band === 'warning') return '#F59E0B';
  return '#EF4444';
}

export function healthTextClass(score: number): string {
  const band = healthBand(score);
  if (band === 'healthy') return 'text-ok';
  if (band === 'warning') return 'text-warn';
  return 'text-bad';
}

export function healthBgClass(score: number): string {
  const band = healthBand(score);
  if (band === 'healthy') return 'bg-ok';
  if (band === 'warning') return 'bg-warn';
  return 'bg-bad';
}

export function fleetAverageHealth(aircraft: { healthScore: number }[]): number {
  if (!aircraft.length) return 0;
  return (
    Math.round(
      (aircraft.reduce((s, a) => s + a.healthScore, 0) / aircraft.length) * 10
    ) / 10
  );
}
