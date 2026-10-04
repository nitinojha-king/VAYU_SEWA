import type { CrewMember, AppNotification } from '@/data/types';
import { minutesAgoTs, hoursAgoTs } from '@/utils/helpers';

/* ============================================================
   Maintenance crew
   ============================================================ */

export const MOCK_CREW: CrewMember[] = [
  {
    id: 1,
    name: 'Tech Sgt. Kumar',
    rank: 'Tech Sergeant',
    skill: 'Hydraulics & Fuel Systems',
    currentAssignment: 'WO-0023 — Hydraulic pump seal (AC-007)',
    aircraftId: 'AC-007',
    tasksToday: 3,
    tasksAssigned: 4,
    tasksCompleted: 2,
    status: 'Busy',
  },
  {
    id: 2,
    name: 'Cpl. R. Nair',
    rank: 'Corporal',
    skill: 'Engine & Propulsion',
    currentAssignment: 'WO-0024 — Fuel nozzle set (AC-012)',
    aircraftId: 'AC-012',
    tasksToday: 2,
    tasksAssigned: 3,
    tasksCompleted: 1,
    status: 'Busy',
  },
  {
    id: 3,
    name: 'Cpl. D. Singh',
    rank: 'Corporal',
    skill: 'Avionics & Instruments',
    currentAssignment: 'WO-0029 — Borescope inspection (AC-014)',
    aircraftId: 'AC-014',
    tasksToday: 2,
    tasksAssigned: 3,
    tasksCompleted: 1,
    status: 'Busy',
  },
  {
    id: 4,
    name: 'Sgt. A. Patel',
    rank: 'Sergeant',
    skill: 'Landing Gear & Airframe',
    currentAssignment: 'WO-0027 — Gear actuator service (AC-011)',
    aircraftId: 'AC-011',
    tasksToday: 2,
    tasksAssigned: 2,
    tasksCompleted: 1,
    status: 'Busy',
  },
  {
    id: 5,
    name: 'Sgt. M. Khan',
    rank: 'Sergeant',
    skill: 'Brakes & Wheels',
    currentAssignment: 'WO-0031 — Brake pad replacement (AC-004)',
    aircraftId: 'AC-004',
    tasksToday: 1,
    tasksAssigned: 2,
    tasksCompleted: 1,
    status: 'Busy',
  },
  {
    id: 6,
    name: 'Cpl. V. Iyer',
    rank: 'Corporal',
    skill: 'General Airframe',
    currentAssignment: 'Unassigned — awaiting tasking',
    aircraftId: null,
    tasksToday: 0,
    tasksAssigned: 1,
    tasksCompleted: 1,
    status: 'Available',
  },
];

/* ============================================================
   Initial notifications
   ============================================================ */

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NT-0001',
    type: 'alert',
    title: 'Critical fault predicted — AC-007',
    description: 'Hydraulic System failure predicted in ~18 hrs. Confidence 87%.',
    timestamp: minutesAgoTs(18),
    read: false,
  },
  {
    id: 'NT-0002',
    type: 'warning',
    title: 'Work Order WO-0023 overdue — AC-007',
    description: 'Replace hydraulic pump seal is past its due window. Reassign crew.',
    timestamp: minutesAgoTs(47),
    read: false,
  },
  {
    id: 'NT-0003',
    type: 'success',
    title: 'Maintenance completed — AC-015',
    description: 'Oil & filter change finished. Aircraft back in service.',
    timestamp: hoursAgoTs(3),
    read: false,
  },
  {
    id: 'NT-0004',
    type: 'info',
    title: 'Low stock alert — HYD-2241',
    description: 'Hydraulic Pump Seal: 0 units remaining against min 5.',
    timestamp: hoursAgoTs(5),
    read: true,
  },
];
