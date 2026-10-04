'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppNotification,
  CrewMember,
  FaultPrediction,
  MaintenanceRecord,
  ProcurementOrder,
  SparePart,
  WorkOrder,
  WOStatus,
  ProcurementStatus,
} from '@/data/types';
import { MOCK_PREDICTIONS, FP_COUNTER_START } from '@/data/mockPredictions';
import { MOCK_WORK_ORDERS, WO_COUNTER_START } from '@/data/mockWorkOrders';
import { MOCK_PARTS } from '@/data/mockParts';
import { MOCK_CREW, INITIAL_NOTIFICATIONS } from '@/data/mockCrew';
import { MOCK_HISTORY } from '@/data/mockHistory';
import { MOCK_PROCUREMENT, MOCK_RECOMMENDATIONS } from '@/data/mockOps';
import { hoursAgoTs, daysFromNow } from '@/utils/helpers';

/* ============================================================
   Business data store — predictions, work orders, parts,
   procurement, notifications. Cross-linked side effects:
   - Work order creation → stock check → auto procurement alert
   ============================================================ */

export interface NewWorkOrderInput {
  aircraftId: string;
  task: string;
  priority: WorkOrder['priority'];
  status?: WOStatus;
  assignedCrew: string;
  partsRequired: string[];
  estimatedHours: number;
  dueBy: string;
  fromPredictionId?: string;
}

interface DataContextValue {
  predictions: FaultPrediction[];
  workOrders: WorkOrder[];
  parts: SparePart[];
  procurement: ProcurementOrder[];
  notifications: AppNotification[];
  crew: CrewMember[];
  history: MaintenanceRecord[];
  recommendations: typeof MOCK_RECOMMENDATIONS;
  addPrediction: (p: Omit<FaultPrediction, 'id' | 'detectedAt' | 'detectedAtTs'>) => FaultPrediction;
  addWorkOrder: (w: NewWorkOrderInput) => WorkOrder;
  updateWorkOrderStatus: (id: string, status: WOStatus) => void;
  updatePartQuantity: (partId: string, quantity: number) => void;
  raiseProcurement: (o: {
    partId: string;
    quantity: number;
    urgency?: ProcurementOrder['urgency'];
    aircraftId?: string;
    workOrderId?: string;
  }) => void;
  setProcurementStatus: (id: string, status: ProcurementStatus) => void;
  acknowledgePrediction: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<FaultPrediction[]>(MOCK_PREDICTIONS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [parts, setParts] = useState<SparePart[]>(MOCK_PARTS);
  const [procurement, setProcurement] = useState<ProcurementOrder[]>(MOCK_PROCUREMENT);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const counters = useRef({ fp: FP_COUNTER_START, wo: WO_COUNTER_START, po: 1106, nt: 100 });

  const pushNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      setNotifications((prev) => [
        {
          id: `NT-${String(counters.current.nt++).padStart(4, '0')}`,
          timestamp: Date.now(),
          read: false,
          ...n,
        },
        ...prev,
      ]);
    },
    []
  );

  const addPrediction = useCallback<DataContextValue['addPrediction']>((p) => {
    const created: FaultPrediction = {
      ...p,
      id: `FP-${String(counters.current.fp++).padStart(3, '0')}`,
      detectedAt: 'just now',
      detectedAtTs: Date.now(),
    };
    setPredictions((prev) => [created, ...prev]);
    return created;
  }, []);

  /** Stock check → auto procurement alert when a WO needs parts we lack */
  const checkPartsAndRaise = useCallback(
    (partsRequired: string[], aircraftId: string, workOrderId: string, priority: string) => {
      partsRequired.forEach((pid) => {
        const part = parts.find((p) => p.partId === pid);
        if (!part) return;
        if (part.quantity >= part.minimumRequired) return;
        const alreadyOpen = procurement.some(
          (o) => o.partId === pid && o.status !== 'received'
        );
        if (alreadyOpen) return;
        const out = part.quantity === 0;
        const po: ProcurementOrder = {
          id: `PO-${counters.current.po++}`,
          partId: part.partId,
          partName: part.name,
          quantity: Math.max(part.minimumRequired * 2, 4),
          status: 'raised',
          raisedOn: daysFromNow(0),
          orderedOn: null,
          expectedDelivery: daysFromNow(out ? 7 : 5),
          supplier: 'Auto-raised — awaiting approval',
          unitCost: part.unitCost,
          aircraftId,
          workOrderId,
          urgency: out || priority === 'critical' ? 'critical' : 'warning',
        };
        setProcurement((prev) => [po, ...prev]);
        pushNotification({
          type: 'info',
          title: `Procurement raised — ${part.partId}`,
          description: `${part.name} short for ${workOrderId} (${aircraftId}). Requisition ${po.id} created.`,
        });
      });
    },
    [parts, procurement, pushNotification]
  );

  const addWorkOrder = useCallback<DataContextValue['addWorkOrder']>(
    (w) => {
      const wo: WorkOrder = {
        id: `WO-${String(counters.current.wo++).padStart(4, '0')}`,
        status: w.status ?? 'pending',
        createdAt: hoursAgoTs(0).toString(),
        ...w,
      };
      setWorkOrders((prev) => [wo, ...prev]);
      pushNotification({
        type: 'success',
        title: `Work order ${wo.id} created`,
        description: `${wo.task} — ${wo.aircraftId}, assigned to ${wo.assignedCrew || 'unassigned'}.`,
      });
      checkPartsAndRaise(wo.partsRequired, wo.aircraftId, wo.id, wo.priority);
      return wo;
    },
    [checkPartsAndRaise, pushNotification]
  );

  const updateWorkOrderStatus = useCallback((id: string, status: WOStatus) => {
    setWorkOrders((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  }, []);

  const updatePartQuantity = useCallback((partId: string, quantity: number) => {
    setParts((prev) =>
      prev.map((p) =>
        p.partId === partId
          ? {
              ...p,
              quantity: Math.max(0, quantity),
              lastRestocked: quantity > 0 ? daysFromNow(0) : p.lastRestocked,
            }
          : p
      )
    );
  }, []);

  const raiseProcurement = useCallback<DataContextValue['raiseProcurement']>(
    ({ partId, quantity, urgency, aircraftId, workOrderId }) => {
      const part = parts.find((p) => p.partId === partId);
      if (!part) return;
      const po: ProcurementOrder = {
        id: `PO-${counters.current.po++}`,
        partId,
        partName: part.name,
        quantity,
        status: 'raised',
        raisedOn: daysFromNow(0),
        orderedOn: null,
        expectedDelivery: daysFromNow(7),
        supplier: 'Awaiting supplier assignment',
        unitCost: part.unitCost,
        aircraftId,
        workOrderId,
        urgency: urgency ?? 'warning',
      };
      setProcurement((prev) => [po, ...prev]);
      pushNotification({
        type: 'info',
        title: `Procurement raised — ${partId}`,
        description: `${quantity} × ${part.name}. Requisition ${po.id} pending approval.`,
      });
    },
    [parts, pushNotification]
  );

  const setProcurementStatus = useCallback(
    (id: string, status: ProcurementStatus) => {
      setProcurement((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status, orderedOn: status === 'ordered' ? daysFromNow(0) : o.orderedOn }
            : o
        )
      );
      const po = procurement.find((o) => o.id === id);
      if (po) {
        pushNotification({
          type: status === 'received' ? 'success' : 'info',
          title: `Procurement ${po.id} → ${status.replace('-', ' ')}`,
          description: `${po.partName} × ${po.quantity} — status updated.`,
        });
      }
    },
    [procurement, pushNotification]
  );

  const acknowledgePrediction = useCallback((id: string) => {
    setPredictions((prev) => prev.map((p) => (p.id === id ? { ...p, acknowledged: true } : p)));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      predictions,
      workOrders,
      parts,
      procurement,
      notifications,
      crew: MOCK_CREW,
      history: MOCK_HISTORY,
      recommendations: MOCK_RECOMMENDATIONS,
      addPrediction,
      addWorkOrder,
      updateWorkOrderStatus,
      updatePartQuantity,
      raiseProcurement,
      setProcurementStatus,
      acknowledgePrediction,
      pushNotification,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      predictions,
      workOrders,
      parts,
      procurement,
      notifications,
      addPrediction,
      addWorkOrder,
      updateWorkOrderStatus,
      updatePartQuantity,
      raiseProcurement,
      setProcurementStatus,
      acknowledgePrediction,
      pushNotification,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
