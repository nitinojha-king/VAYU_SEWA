'use client';

import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  Brain,
  ClipboardList,
  History,
  Box,
  Plus,
  Plane,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import SensorChart from '@/components/charts/SensorChart';
import ConfidenceRing from '@/components/charts/ConfidenceRing';
import ProgressBar from '@/components/shared/ProgressBar';
import AircraftSVG from '@/components/digital-twin/AircraftSVG';
import ComponentPanel from '@/components/digital-twin/ComponentPanel';
import WorkOrderModal, { type WOPrefill } from '@/components/shared/WorkOrderModal';
import EmptyState from '@/components/shared/EmptyState';
import { StatusBadge, SeverityBadge, PriorityBadge, WorkOrderStatusBadge } from '@/components/shared/Badge';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate, hoursToHuman } from '@/utils/helpers';
import { SkeletonChart, SkeletonCard } from '@/components/shared/SkeletonLoader';
import { healthColor, healthBand } from '@/utils/healthCalculator';
import { SENSOR_METRICS } from '@/utils/sensorSimulator';
import type { ComponentKey, WOStatus } from '@/data/types';

/* ============================================================
   Engineer — Aircraft Detail (/engineer/aircraft/:id)
   Tabs: Sensors · Predictions · Work Orders · History · Digital Twin
   ============================================================ */

const TABS = [
  { key: 'sensors', label: 'Sensors', icon: Gauge },
  { key: 'predictions', label: 'Predictions', icon: Brain },
  { key: 'workorders', label: 'Work Orders', icon: ClipboardList },
  { key: 'history', label: 'History', icon: History },
  { key: 'digitaltwin', label: 'Digital Twin', icon: Box },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function AircraftDetail() {
  const { id } = useParams<{ id: string }>();
  const { aircraft, readings } = useSensors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('sensors');
  const ac = aircraft.find((a) => a.id === id);
  const loading = useMockLoading();

  if (!ac) {
    return (
      <div className="ag-card">
        <EmptyState
          icon={Plane}
          title={`Aircraft ${id} not found`}
          message="It may have been re-registered. Return to the health monitor."
        />
        <div className="pb-6 -mt-4 flex justify-center">
          <Link to="/engineer" className="text-xs font-semibold text-navy hover:text-navy-hover">
            ← Back to Aircraft Health
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ag-fade">
        <button
          onClick={() => navigate('/engineer')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-navy transition-colors mb-3"
        >
          <ArrowLeft size={13} /> Back to Aircraft Health
        </button>
        <PageHeader
          title={`${ac.id} — ${ac.name}`}
          subtitle={`${ac.type} · ${ac.squadron} · ${ac.base} · ${ac.flightHours.toLocaleString('en-IN')} flight hrs · ${ac.engineCycles.toLocaleString('en-IN')} engine cycles`}
          actions={
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums" style={{ color: healthColor(ac.healthScore) }}>
                {Math.round(ac.healthScore)}%
              </span>
              <StatusBadge status={ac.status} />
            </div>
          }
        />
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 ag-fade ag-fade-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                on ? 'border-navy text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        tab === 'sensors' ? <SkeletonChart h={220} /> : <SkeletonCard />
      ) : (
        <div className="ag-fade-in">
          {tab === 'sensors' && <SensorsTab aircraftId={ac.id} readings={readings[ac.id] ?? []} />}
          {tab === 'predictions' && <PredictionsTab aircraftId={ac.id} />}
          {tab === 'workorders' && <WorkOrdersTab aircraftId={ac.id} />}
          {tab === 'history' && <HistoryTab aircraftId={ac.id} />}
          {tab === 'digitaltwin' && <DigitalTwinTab aircraftId={ac.id} />}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sensors tab ---------------- */

function SensorsTab({ aircraftId, readings }: { aircraftId: string; readings: ReturnType<typeof useSensors>['readings'][string] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {SENSOR_METRICS.map((m, i) => (
        <div key={m} className="ag-fade" style={{ animationDelay: `${i * 50}ms` }}>
          <SensorChart metric={m} data={readings} />
        </div>
      ))}
      <p className="col-span-full text-[11px] text-slate-400 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-ok ag-blink" />
        Live feed for {aircraftId} — rolling window of the last 20 readings, refreshed every 2 seconds.
      </p>
    </div>
  );
}

/* ---------------- Predictions tab ---------------- */

function PredictionsTab({ aircraftId }: { aircraftId: string }) {
  const { predictions } = useData();
  const [prefill, setPrefill] = useState<WOPrefill | null>(null);
  const [open, setOpen] = useState(false);
  const preds = predictions.filter((p) => p.aircraftId === aircraftId);

  if (preds.length === 0) {
    return (
      <div className="ag-card">
        <EmptyState icon={Brain} title="No active fault predictions" message="Fleet sensors are nominal on this airframe." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preds.map((p, i) => (
        <div key={p.id} className="ag-card p-5 ag-fade" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="shrink-0">
              <ConfidenceRing value={p.confidence} size={86} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-base font-bold text-slate-900">{p.component}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {p.id} · detected {p.detectedAt}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${p.severity === 'critical' ? 'text-bad' : 'text-warn'}`}>
                    ~{hoursToHuman(p.estimatedFailureHours)}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">to failure</p>
                </div>
              </div>

              <div className="mt-3 rounded-md bg-navy/5 border border-navy/15 px-3.5 py-2.5">
                <p className="text-xs text-navy leading-relaxed">
                  <span className="font-bold">Recommended action:</span> {p.recommendedAction}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => {
                    setPrefill({
                      aircraftId,
                      task: p.recommendedAction,
                      priority: p.severity === 'critical' ? 'critical' : 'high',
                      partsRequired: p.partsRequired,
                      estimatedHours: 4,
                      fromPredictionId: p.id,
                    });
                    setOpen(true);
                  }}
                  className="h-9 px-3.5 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
                >
                  Create Work Order
                </button>
                {p.acknowledged ? (
                  <span className="text-[11px] font-semibold text-ok flex items-center gap-1">
                    ✓ Acknowledged
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
      <WorkOrderModal open={open} onClose={() => setOpen(false)} prefill={prefill} />
    </div>
  );
}

/* ---------------- Work Orders tab ---------------- */

function WorkOrdersTab({ aircraftId }: { aircraftId: string }) {
  const { workOrders, updateWorkOrderStatus } = useData();
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () => workOrders.filter((w) => w.aircraftId === aircraftId),
    [workOrders, aircraftId]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="h-9 px-3.5 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Work Order
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={ClipboardList} title="No work orders for this aircraft" message="All maintenance up to date." />
        </div>
      ) : (
        <div className="ag-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                {['WO ID', 'Task', 'Priority', 'Status', 'Crew', 'Due By'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-slate-50 hover:bg-cloud/60 transition-colors">
                  <td className="px-3 py-3 text-xs font-bold text-slate-800">{w.id}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{w.task}</td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={w.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={w.status}
                      onChange={(e) => updateWorkOrderStatus(w.id, e.target.value as WOStatus)}
                      className="h-7 rounded border border-slate-200 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-navy px-1.5"
                      aria-label={`Update status for ${w.id}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <div className="mt-1">
                      <WorkOrderStatusBadge status={w.status} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{w.assignedCrew}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{fmtDate(w.dueBy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <WorkOrderModal open={open} onClose={() => setOpen(false)} prefill={{ aircraftId }} />
    </div>
  );
}

/* ---------------- History tab ---------------- */

function HistoryTab({ aircraftId }: { aircraftId: string }) {
  const { history } = useData();
  const rows = useMemo(
    () => history.filter((h) => h.aircraftId === aircraftId).slice(0, 12),
    [history, aircraftId]
  );

  if (rows.length === 0) {
    return (
      <div className="ag-card">
        <EmptyState icon={History} title="No maintenance history" message="Records will appear after the first logged task." />
      </div>
    );
  }

  return (
    <div className="ag-card p-6">
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
        <div className="space-y-6">
          {rows.map((h, i) => (
            <div key={h.id} className="relative ag-fade" style={{ animationDelay: `${i * 40}ms` }}>
              <span
                className={`absolute -left-6 top-1 w-[15px] h-[15px] rounded-full border-[3px] border-white ${
                  h.type === 'Repair' ? 'bg-bad' : h.type === 'Component Replacement' ? 'bg-warn' : 'bg-navy'
                }`}
              />
              <p className="text-xs font-bold text-slate-800">{h.task}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {fmtDate(h.date)} · {h.crew} · {h.durationHours} hrs ·{' '}
                <span className="font-medium text-slate-500">{h.type}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Digital Twin tab ---------------- */

function DigitalTwinTab({ aircraftId }: { aircraftId: string }) {
  const { aircraft } = useSensors();
  const { predictions } = useData();
  const ac = aircraft.find((a) => a.id === aircraftId)!;
  const [zone, setZone] = useState<ComponentKey | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900">{ac.id} — Digital Twin — Live Health View</p>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-ok ag-blink" />
          Updates every 2 seconds from live sensor feed
        </p>
      </div>
      <div className="ag-card p-6 flex justify-center">
        <AircraftSVG aircraft={ac} predictions={predictions} onSelect={setZone} />
      </div>
      <ComponentPanel aircraft={ac} componentKey={zone} onClose={() => setZone(null)} />
    </div>
  );
}
