'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Aircraft, ComponentKey, SensorMetric, SensorReading } from '@/data/types';
import { MOCK_AIRCRAFT } from '@/data/mockAircraft';
import {
  generateReading,
  isAnomalous,
  anomalyFactor,
  SENSOR_METRICS,
} from '@/utils/sensorSimulator';
import { computeHealth, fleetAverageHealth } from '@/utils/healthCalculator';
import { useData } from '@/context/DataContext';

/* ============================================================
   Live sensor engine
   - 2s tick: generate readings for all aircraft (20-pt window)
   - anomaly detection: 3 consecutive out-of-range readings on a
     channel → auto fault prediction + notification
   - health recalc: weighted component scores degrade on anomaly,
     recover slowly otherwise
   - 30s: simulated ops notification feed
   ============================================================ */

const WINDOW = 20;
const TICK_MS = 2000;
const NOTIFY_MS = 30000;

const METRIC_COMPONENT: Record<SensorMetric, ComponentKey> = {
  engineTemp: 'engine',
  vibration: 'engine',
  oilPressure: 'hydraulic',
  fuelFlow: 'fuelSystem',
};

const COMPONENT_PART: Partial<Record<ComponentKey, string>> = {
  engine: 'ENG-0912',
  hydraulic: 'SEAL-889',
  fuelSystem: 'FILT-OIL',
  avionics: 'AVN-0331',
  landingGear: 'LGA-0450',
};

/* working copy + baselines built once at module scope */
const INITIAL_SIM_AIRCRAFT: Aircraft[] = MOCK_AIRCRAFT.map((a) => ({
  ...a,
  components: { ...a.components },
}));

function buildBaseline(): Record<string, Aircraft['components']> {
  const b: Record<string, Aircraft['components']> = {};
  MOCK_AIRCRAFT.forEach((a) => (b[a.id] = { ...a.components }));
  return b;
}
const BASELINES = buildBaseline();

/* cooldown so the anomaly engine doesn't spam predictions: one auto
   prediction per aircraft+component per 10 minutes */
const AUTO_PRED_COOLDOWN_MS = 10 * 60 * 1000;

interface SensorContextValue {
  aircraft: Aircraft[];
  readings: Record<string, SensorReading[]>;
  latest: Record<string, SensorReading | undefined>;
  fleetHealth: number;
  tick: number;
  anomalyNow: Record<string, Partial<Record<SensorMetric, boolean>>>;
}

const SensorContext = createContext<SensorContextValue | null>(null);

export function SensorProvider({ children }: { children: ReactNode }) {
  const { addPrediction, pushNotification } = useData();
  const [aircraft, setAircraft] = useState<Aircraft[]>(MOCK_AIRCRAFT);
  const [readings, setReadings] = useState<Record<string, SensorReading[]>>(() => {
    // prefill so charts render instantly
    const init: Record<string, SensorReading[]> = {};
    const cycles: Record<string, number> = {};
    MOCK_AIRCRAFT.forEach((a) => {
      cycles[a.id] = a.engineCycles;
      const arr: SensorReading[] = [];
      for (let i = WINDOW; i > 0; i--) {
        const r = generateReading(a, cycles[a.id]);
        r.timestamp = Date.now() - i * TICK_MS;
        arr.push(r);
      }
      init[a.id] = arr;
    });
    return init;
  });
  const [tick, setTick] = useState(0);

  // mutable sim state — refs are only touched inside effects
  const aircraftRef = useRef<Aircraft[]>(INITIAL_SIM_AIRCRAFT);
  const streaksRef = useRef<Record<string, number>>({});
  const latestRef = useRef<Record<string, SensorReading | undefined>>({});
  const lastAutoPredRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // local mutable snapshot of readings for the rolling window
    let currentReadings = readings;
    const interval = setInterval(() => {
      const newReadings: Record<string, SensorReading[]> = {};
      const nextAircraft: Aircraft[] = [];

      aircraftRef.current.forEach((ac) => {
        // advance engine cycles slowly
        if (Math.random() < 0.08) ac.engineCycles += 1;
        const reading = generateReading(ac, ac.engineCycles);
        latestRef.current[ac.id] = reading;

        // ---- anomaly streaks + auto fault detection ----
        const anomalyNow: Partial<Record<SensorMetric, boolean>> = {};
        SENSOR_METRICS.forEach((metric) => {
          const key = `${ac.id}:${metric}`;
          const bad = isAnomalous(metric, reading[metric]);
          anomalyNow[metric] = bad;
          if (bad) {
            streaksRef.current[key] = (streaksRef.current[key] ?? 0) + 1;
          } else {
            streaksRef.current[key] = 0;
          }
          if (streaksRef.current[key] >= 3) {
            const componentKey = METRIC_COMPONENT[metric];
            const cooldownKey = `${ac.id}:${componentKey}`;
            const last = lastAutoPredRef.current[cooldownKey] ?? 0;
            streaksRef.current[key] = 0; // reset streak either way
            if (Date.now() - last < AUTO_PRED_COOLDOWN_MS) return; // still cooling down
            lastAutoPredRef.current[cooldownKey] = Date.now();
            const label = metric === 'engineTemp' ? 'Engine over-temperature' : metric === 'vibration' ? 'Abnormal vibration' : metric === 'oilPressure' ? 'Oil pressure drop' : 'Fuel flow deviation';
            const confidence = 52 + Math.round(Math.random() * 20);
            addPrediction({
              aircraftId: ac.id,
              component: label,
              componentKey,
              confidence,
              estimatedFailureHours: 24 + Math.round(Math.random() * 48),
              severity: 'warning',
              recommendedAction: `Auto-detected by anomaly engine after 3 consecutive out-of-range ${metric} readings. Schedule diagnostic inspection.`,
              partsRequired: COMPONENT_PART[componentKey] ? [COMPONENT_PART[componentKey] as string] : [],
              autoGenerated: true,
            });
            pushNotification({
              type: 'warning',
              title: `Anomaly detected — ${ac.id}`,
              description: `${label}: 3 consecutive out-of-range ${metric} readings. Prediction FP raised at ${confidence}% confidence.`,
            });
          }
        });

        // ---- health recalculation ----
        const comps = ac.components;
        const base = BASELINES[ac.id];
        (Object.keys(comps) as ComponentKey[]).forEach((ck) => {
          const relatedMetrics = SENSOR_METRICS.filter((m) => METRIC_COMPONENT[m] === ck);
          const stressed = relatedMetrics.some((m) => anomalyNow[m]);
          if (stressed) {
            const f = Math.max(
              ...relatedMetrics.map((m) => anomalyFactor(m, reading[m]))
            );
            comps[ck] = Math.max(5, comps[ck] - (0.4 + f * 1.2));
          } else {
            comps[ck] = Math.min(base[ck], comps[ck] + 0.22);
          }
          comps[ck] = Math.round(comps[ck] * 10) / 10;
        });
        const updated: Aircraft = { ...ac, healthScore: computeHealth(comps) };
        nextAircraft.push(updated);

        // ---- rolling window ----
        const prev = currentReadings[ac.id] ?? [];
        const window = [...prev, reading].slice(-WINDOW);
        newReadings[ac.id] = window;
      });

      aircraftRef.current = nextAircraft;
      currentReadings = newReadings;
      setReadings(newReadings);
      setAircraft(nextAircraft);
      setTick((t) => t + 1);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [addPrediction, pushNotification]);

  // seeded notification generator — every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const pool = aircraftRef.current.filter((a) =>
        ['warning', 'critical', 'maintenance'].includes(a.status)
      );
      const templates: ((a: Aircraft) => { type: 'alert' | 'warning' | 'info' | 'success'; title: string; description: string })[] = [
        (a) => ({ type: 'alert', title: `Vibration spike — ${a.id}`, description: `${a.name} recorded 1.6g vibration on last reading. Monitoring.` }),
        (a) => ({ type: 'warning', title: `Oil pressure trending low — ${a.id}`, description: `${a.name} oil pressure fell below 13.5 psi for 2 readings.` }),
        (a) => ({ type: 'info', title: `Sensor calibration check — ${a.id}`, description: `Automated BIT on ${a.name} completed. No new faults recorded.` }),
        (a) => ({ type: 'warning', title: `Engine temp margin narrowing — ${a.id}`, description: `${a.name} EGT margin reduced 8% below fleet baseline.` }),
      ];
      if (pool.length === 0) return;
      const a = pool[Math.floor(Math.random() * pool.length)];
      const t = templates[Math.floor(Math.random() * templates.length)];
      pushNotification(t(a));
    }, NOTIFY_MS);
    return () => clearInterval(interval);
  }, [pushNotification]);

  const latest = useMemo(() => {
    const map: Record<string, SensorReading | undefined> = {};
    Object.entries(readings).forEach(([id, arr]) => {
      map[id] = arr[arr.length - 1];
    });
    return map;
  }, [readings]);

  const anomalyNow = useMemo(() => {
    const map: Record<string, Partial<Record<SensorMetric, boolean>>> = {};
    Object.entries(readings).forEach(([id, arr]) => {
      const last = arr[arr.length - 1];
      if (!last) return;
      map[id] = {};
      SENSOR_METRICS.forEach((m) => {
        map[id]![m] = isAnomalous(m, last[m]);
      });
    });
    return map;
  }, [readings]);

  const fleetHealth = useMemo(() => fleetAverageHealth(aircraft), [aircraft]);

  return (
    <SensorContext.Provider value={{ aircraft, readings, latest, fleetHealth, tick, anomalyNow }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensors(): SensorContextValue {
  const ctx = useContext(SensorContext);
  if (!ctx) throw new Error('useSensors must be used inside SensorProvider');
  return ctx;
}
