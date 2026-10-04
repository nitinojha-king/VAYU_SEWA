import type { Aircraft, SensorReading, SensorMetric } from '@/data/types';

/* ============================================================
   Sensor data simulator — NASA CMAPSS-style degradation noise
   Runs every 2 seconds per aircraft via SensorContext
   ============================================================ */

export const SENSOR_RANGES: Record<
  SensorMetric,
  { min: number; max: number; spikeMin: number; spikeMax: number; unit: string; label: string; higherIsBad: boolean }
> = {
  engineTemp: { min: 650, max: 950, spikeMin: 1050, spikeMax: 1100, unit: '°C', label: 'Engine Temperature', higherIsBad: true },
  vibration: { min: 0.1, max: 0.9, spikeMin: 1.5, spikeMax: 1.8, unit: 'g', label: 'Vibration', higherIsBad: true },
  oilPressure: { min: 14.5, max: 15.5, spikeMin: 12.0, spikeMax: 13.2, unit: 'psi', label: 'Oil Pressure', higherIsBad: false },
  fuelFlow: { min: 450, max: 550, spikeMin: 650, spikeMax: 720, unit: 'kg/h', label: 'Fuel Flow', higherIsBad: true },
};

export const SENSOR_METRICS: SensorMetric[] = ['engineTemp', 'vibration', 'oilPressure', 'fuelFlow'];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Probability of a random anomaly tick on a healthy aircraft */
const ANOMALY_CHANCE = 0.05;

export function isAnomalous(metric: SensorMetric, value: number): boolean {
  const r = SENSOR_RANGES[metric];
  return r.higherIsBad ? value > r.max : value < r.min;
}

export function generateReading(
  aircraft: Aircraft,
  cycles: number,
  forceAnomaly?: SensorMetric
): SensorReading {
  const critical = aircraft.status === 'critical' || aircraft.status === 'grounded';
  const warning = aircraft.status === 'warning';

  let anomalyMetric: SensorMetric | undefined = forceAnomaly;
  let secondMetric: SensorMetric | undefined;
  if (!anomalyMetric && (critical || Math.random() < (warning ? 0.3 : ANOMALY_CHANCE))) {
    // critical aircraft ALWAYS anomalous; warning biased
    anomalyMetric = SENSOR_METRICS[Math.floor(Math.random() * SENSOR_METRICS.length)];
  }
  if (critical && Math.random() < 0.5) {
    // critical aircraft often degrade two channels at once
    secondMetric = SENSOR_METRICS[Math.floor(Math.random() * SENSOR_METRICS.length)];
  }

  const pick = (m: SensorMetric): number => {
    const r = SENSOR_RANGES[m];
    const anomalous = m === anomalyMetric || m === secondMetric;
    if (anomalous) return rand(r.spikeMin, r.spikeMax) * (r.higherIsBad ? 1 : 1);
    if (r.higherIsBad) return rand(r.min, r.max);
    return rand(r.min, r.max);
  };

  return {
    aircraftId: aircraft.id,
    timestamp: Date.now(),
    engineTemp: Math.round(pick('engineTemp')),
    vibration: Math.round(pick('vibration') * 100) / 100,
    oilPressure: Math.round(pick('oilPressure') * 100) / 100,
    fuelFlow: Math.round(pick('fuelFlow')),
    engineCycles: cycles,
  };
}

/** Severity of an anomaly 0..1 used for health degradation pacing */
export function anomalyFactor(metric: SensorMetric, value: number): number {
  const r = SENSOR_RANGES[metric];
  if (!isAnomalous(metric, value)) return 0;
  if (r.higherIsBad) {
    return Math.min(1, (value - r.max) / (r.spikeMax - r.max));
  }
  return Math.min(1, (r.min - value) / (r.min - r.spikeMax));
}
