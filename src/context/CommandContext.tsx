'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Aircraft } from '@/data/types';
import { toast } from '@/hooks/use-toast';
import {
  INITIAL_COMMAND_LOG,
  optionFor,
  type CommandLogEntry,
  type DecisionState,
  type MissionRisk,
  type OverrideReason,
  type ScenarioId,
} from '@/data/commanderData';

/* ============================================================
   Command decision state.

   Frontend-only simulation: no backend, no persistence. Lives in
   a context so the Fleet Overview card and the Mission Readiness
   page stay in sync across the route change.
   ============================================================ */

export interface DecisionRecord {
  aircraftId: string;
  scenario: ScenarioId | null;
  state: DecisionState;
  overrideReason?: OverrideReason;
  overrideNotes?: string;
}

export interface SubstitutionRecord {
  unavailableId: string;
  replacementId: string;
  protectedSorties: number;
}

export interface CommandContextValue {
  /** aircraft id whose drawer is open, or null */
  openAircraftId: string | null;
  openAircraft: (id: string | null) => void;

  decisions: Record<string, DecisionRecord>;
  decisionFor: (aircraftId: string) => DecisionRecord | undefined;

  selectScenario: (aircraftId: string, scenario: ScenarioId) => void;

  approve: (aircraftId: string, name: string) => void;
  override: (aircraftId: string, name: string, reason: OverrideReason, notes: string) => void;
  requestTransfer: (aircraftId: string, partId: string, fromBase: string) => void;

  /** approved aircraft substitutions, keyed by the unavailable airframe */
  substitutions: Record<string, SubstitutionRecord>;
  approveSubstitution: (
    unavailableId: string,
    unavailableName: string,
    replacementId: string,
    replacementName: string,
    protectedSorties: number
  ) => void;

  partTransfer: Record<string, boolean>;
  log: CommandLogEntry[];
  clearLog: () => void;

  /** airframe currently selected on the operational map */
  mapAircraftId: string | null;
  selectMapAircraft: (aircraftId: string | null) => void;

  /** mission risk after the decision has been taken */
  riskAfter: (aircraftId: string, current: MissionRisk) => MissionRisk;
  /** aircraft status after the decision (approved grounding → maintenance) */
  statusAfter: (aircraft: Aircraft) => Aircraft['status'];
  /** projected fleet availability after the selected scenario */
  projectedAfter: (aircraftId: string, baseline: number) => number;
  substitutionFor: (aircraftId: string) => SubstitutionRecord | undefined;
}

const CommandContext = createContext<CommandContextValue | null>(null);

function stamp(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function CommandProvider({ children }: { children: ReactNode }) {
  const [openAircraftId, setOpenAircraftId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>({});
  const [partTransfer, setPartTransfer] = useState<Record<string, boolean>>({});
  const [substitutions, setSubstitutions] = useState<Record<string, SubstitutionRecord>>({});
  const [log, setLog] = useState<CommandLogEntry[]>(INITIAL_COMMAND_LOG);
  const [mapAircraftId, setMapAircraftId] = useState<string | null>(null);

  const selectMapAircraft = useCallback((aircraftId: string | null) => {
    setMapAircraftId(aircraftId);
    // selecting on the map also focuses that airframe's decision drawer target
    setOpenAircraftId(aircraftId);
  }, []);

  const openAircraft = useCallback((id: string | null) => setOpenAircraftId(id), []);

  const decisionFor = useCallback(
    (aircraftId: string) => decisions[aircraftId],
    [decisions]
  );

  const selectScenario = useCallback((aircraftId: string, scenario: ScenarioId) => {
    setDecisions((prev) => {
      const existing = prev[aircraftId];
      if (existing?.state === 'approved' || existing?.state === 'overridden') return prev;
      return {
        ...prev,
        [aircraftId]: {
          aircraftId,
          scenario,
          state: 'pending',
          overrideReason: existing?.overrideReason,
          overrideNotes: existing?.overrideNotes,
        },
      };
    });
  }, []);

  const approve = useCallback((aircraftId: string, name: string) => {
    setDecisions((prev) => ({
      ...prev,
      [aircraftId]: {
        aircraftId,
        scenario: prev[aircraftId]?.scenario ?? 'ground',
        state: 'approved',
      },
    }));
    setLog((prev) => [
      {
        id: `CL-${Date.now()}`,
        time: stamp(),
        ref: aircraftId,
        action: `${aircraftId} grounding approved by Commander`,
        actor: 'Commander',
        tone: 'approved',
      },
      ...prev,
    ]);
    toast({
      title: 'Command action approved',
      description: `${aircraftId} (${name}) assigned for inspection.`,
    });
  }, []);

  const override = useCallback(
    (aircraftId: string, name: string, reason: OverrideReason, notes: string) => {
      setDecisions((prev) => ({
        ...prev,
        [aircraftId]: {
          aircraftId,
          scenario: 'continue',
          state: 'overridden',
          overrideReason: reason,
          overrideNotes: notes,
        },
      }));
      setLog((prev) => [
        {
          id: `CL-${Date.now()}`,
          time: stamp(),
          ref: aircraftId,
          action: `${aircraftId} recommendation overridden by Commander`,
          actor: 'Commander',
          tone: 'override',
        },
        ...prev,
      ]);
      toast({
        title: 'Override recorded',
        description: `${aircraftId} (${name}) returned to service — ${reason}.`,
      });
    },
    []
  );

  const requestTransfer = useCallback((aircraftId: string, partId: string, fromBase: string) => {
    setPartTransfer((prev) => ({ ...prev, [aircraftId]: true }));
    setLog((prev) => [
      {
        id: `CL-${Date.now()}`,
        time: stamp(),
        ref: partId,
        action: `${partId} spare transfer requested from ${fromBase}`,
        actor: 'Commander',
        tone: 'transfer',
      },
      ...prev,
    ]);
    toast({
      title: 'Spare transfer requested',
      description: `${partId} inbound from ${fromBase} · 2.5 hrs.`,
    });
  }, []);

  const clearLog = useCallback(() => setLog(INITIAL_COMMAND_LOG), []);

  const approveSubstitution = useCallback(
    (
      unavailableId: string,
      unavailableName: string,
      replacementId: string,
      replacementName: string,
      protectedSorties: number
    ) => {
      setSubstitutions((prev) => ({
        ...prev,
        [unavailableId]: { unavailableId, replacementId, protectedSorties },
      }));
      // grounding the unavailable airframe is part of the same command action
      setDecisions((prev) => ({
        ...prev,
        [unavailableId]: {
          aircraftId: unavailableId,
          scenario: 'ground',
          state: 'approved',
        },
      }));
      setLog((prev) => [
        {
          id: `CL-${Date.now()}`,
          time: stamp(),
          ref: replacementId,
          action: `${replacementId} assigned as replacement for ${unavailableId}`,
          actor: 'Commander',
          tone: 'approved',
        },
        ...prev,
      ]);
      toast({
        title: 'Replacement assigned',
        description: `${replacementId} (${replacementName}) assigned for ${unavailableName}. ${protectedSorties} sortie(s) protected.`,
      });
    },
    []
  );

  const substitutionFor = useCallback(
    (aircraftId: string) => substitutions[aircraftId],
    [substitutions]
  );

  const riskAfter = useCallback(
    (aircraftId: string, current: MissionRisk): MissionRisk => {
      const rec = decisions[aircraftId];
      if (substitutions[aircraftId]) return 'LOW';
      if (!rec) return current;
      if (rec.state === 'approved') return 'LOW';
      if (rec.state === 'overridden') return 'HIGH';
      return optionFor(rec.scenario)?.riskTo ?? current;
    },
    [decisions, substitutions]
  );

  const statusAfter = useCallback(
    (aircraft: Aircraft): Aircraft['status'] => {
      const rec = decisions[aircraft.id];
      if (rec?.state === 'approved') return 'grounded';
      return aircraft.status;
    },
    [decisions]
  );

  const projectedAfter = useCallback(
    (aircraftId: string, baseline: number): number =>
      optionFor(decisions[aircraftId]?.scenario ?? null)?.projectedPct ?? baseline,
    [decisions]
  );

  const value = useMemo<CommandContextValue>(
    () => ({
      openAircraftId,
      openAircraft,
      decisions,
      decisionFor,
      selectScenario,
      approve,
      override,
      partTransfer,
      requestTransfer,
      substitutions,
      approveSubstitution,
      substitutionFor,
      log,
      clearLog,
      mapAircraftId,
      selectMapAircraft,
      riskAfter,
      statusAfter,
      projectedAfter,
    }),
    [
      openAircraftId,
      openAircraft,
      decisions,
      decisionFor,
      selectScenario,
      approve,
      override,
      partTransfer,
      requestTransfer,
      substitutions,
      approveSubstitution,
      substitutionFor,
      log,
      clearLog,
      mapAircraftId,
      selectMapAircraft,
      riskAfter,
      statusAfter,
      projectedAfter,
    ]
  );

  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}

export function useCommand(): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error('useCommand must be used inside CommandProvider');
  return ctx;
}