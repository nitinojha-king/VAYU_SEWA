import type { Role } from '@/data/types';

/* ============================================================
   Communications — channel config + seed messages

   Frontend-only demo. Channel structure and seed messages are
   baked in so each role opens to a populated, realistic thread
   rather than an empty shell.

   Channel ids are stable so localStorage-persisted messages can
   be keyed by channelId.
   ============================================================ */

export interface Channel {
  id: string;
  name: string;
  team: string;        // grouping label shown in the left panel
  role: Role;         // which role may see this channel
}

export interface CommMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: number;   // epoch ms — persisted in localStorage
}

/* ---------- channel trees per role ---------- */

export const CHANNELS: Channel[] = [
  // ---- Commander ----
  { id: 'cmd-hq',   name: 'HEADQUARTERS', team: 'HEADQUARTERS', role: 'commander' },
  { id: 'cmd-head-a', name: 'Head A',        team: 'HEADQUARTERS', role: 'commander' },
  { id: 'cmd-head-b', name: 'Head B',        team: 'HEADQUARTERS', role: 'commander' },
  { id: 'cmd-head-c', name: 'Head C',        team: 'HEADQUARTERS', role: 'commander' },
  { id: 'cmd-eng',  name: 'ENGINEER',        team: 'ENGINEER',     role: 'commander' },
  { id: 'cmd-log',  name: 'LOGISTICS',       team: 'LOGISTICS',    role: 'commander' },

  // ---- Engineer ----
  { id: 'eng-bay',    name: 'MAINTENANCE BAY', team: 'MAINTENANCE BAY', role: 'engineer' },
  { id: 'eng-tool',   name: 'TOOL ROOM',      team: 'TOOL ROOM',      role: 'engineer' },
  { id: 'eng-hangar', name: 'HANGAR',         team: 'HANGAR',         role: 'engineer' },
  { id: 'eng-parts',  name: 'PARTS DESK',     team: 'PARTS DESK',     role: 'engineer' },

  // ---- Logistics ----
  { id: 'log-depot',   name: 'DEPOT',       team: 'DEPOT',       role: 'logistics' },
  { id: 'log-store',   name: 'STORE',       team: 'STORE',       role: 'logistics' },
  { id: 'log-dispatch',name: 'DISPATCH',    team: 'DISPATCH',    role: 'logistics' },
  { id: 'log-procure', name: 'PROCUREMENT', team: 'PROCUREMENT', role: 'logistics' },
];

export function channelsForRole(role: Role): Channel[] {
  return CHANNELS.filter((c) => c.role === role);
}

/** top-level teams for the left panel (deduplicated, in display order) */
export function teamsForRole(role: Role): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of channelsForRole(role)) {
    if (seen.has(c.team)) continue;
    seen.add(c.team);
    out.push(c.team);
  }
  return out;
}

/** channels belonging to a team — the team channel first, then its sub-channels */
export function channelsInTeam(role: Role, team: string): Channel[] {
  const list = channelsForRole(role).filter((c) => c.team === team);
  return [...list.filter((c) => c.name === team), ...list.filter((c) => c.name !== team)];
}

/* ---------- seed messages (demo data) ---------- */

const TS = (offset: number): number =>
  Date.now() - offset * 60 * 1000; // `offset` minutes ago

export const SEED_MESSAGES: CommMessage[] = [
  // HEADQUARTERS / Head A
  {
    id: 'm-1',
    channelId: 'cmd-head-a',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'All squadrons report readiness for the 16:00 Combat Patrol blotter. AC-007 and AC-012 still under review — do not task.',
    timestamp: TS(18),
  },
  {
    id: 'm-2',
    channelId: 'cmd-head-a',
    senderId: 'RS',
    senderName: 'Wing Cdr. R. Sharma',
    senderRole: 'commander',
    text: 'Head A confirms. AC-007 decision pending Commander sign-off. AC-019 maintenance due tonight — will update once the stand-down is cleared.',
    timestamp: TS(14),
  },
  {
    id: 'm-3',
    channelId: 'cmd-head-a',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Copy that. Push AC-019 stand-down to first light tomorrow if the crew can make it. I want the Combat Patrol sortie window protected.',
    timestamp: TS(10),
  },
  {
    id: 'm-4',
    channelId: 'cmd-head-a',
    senderId: 'RS',
    senderName: 'Wing Cdr. R. Sharma',
    senderRole: 'commander',
    text: 'Understood, Commander. AC-019 crew rostered for 06:00 tomorrow. Night maintenance team already notified.',
    timestamp: TS(6),
  },

  // HEADQUARTERS / Head B
  {
    id: 'm-5',
    channelId: 'cmd-head-b',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Head B — AC-012 fuel nozzle replacement is the top priority tonight. Cpl. Nair has the crew. Confirm the hangar is clear by 21:00.',
    timestamp: TS(32),
  },
  {
    id: 'm-6',
    channelId: 'cmd-head-b',
    senderId: 'PB',
    senderName: 'Wing Cdr. P. Bansal',
    senderRole: 'commander',
    text: 'Head B copy. Hangar 2 cleared and booked for AC-012 from 20:30. Hot-section kit staged. Expect 9-hour window as per the impact report.',
    timestamp: TS(28),
  },
  {
    id: 'm-7',
    channelId: 'cmd-head-b',
    senderId: 'PB',
    senderName: 'Wing Cdr. P. Bansal',
    senderRole: 'commander',
    text: 'One note — FUE-1102 stock is short by 2 sets across the depot. Logistics has been asked to expedite. I will keep you posted.',
    timestamp: TS(22),
  },
  {
    id: 'm-8',
    channelId: 'cmd-head-b',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Acknowledge the parts constraint. If the nozzle set does not land by 06:00, fall back to AC-004 as the alternate on MSN-4412. Keep me informed.',
    timestamp: TS(16),
  },

  // HEADQUARTERS / Head C
  {
    id: 'm-9',
    channelId: 'cmd-head-c',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Head C — border patrol tasking for tomorrow morning stands. AC-001 and AC-006 paired. Weather over the northern sector is clear; no abort criteria beyond the usual.',
    timestamp: TS(45),
  },
  {
    id: 'm-10',
    channelId: 'cmd-head-c',
    senderId: 'DC',
    senderName: 'Wing Cdr. D. Chauhan',
    senderRole: 'commander',
    text: 'Head C copy. AC-001 and AC-006 briefed. AC-003 is unavailable until maintenance clears, so the pair is unchanged. I will raise the sortie flag at 05:30.',
    timestamp: TS(40),
  },

  // ENGINEER (Commander → Engineer team)
  {
    id: 'm-11',
    channelId: 'cmd-eng',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Engineering — I need the AC-012 engine vibration anomaly disposition by 22:00. The combat patrol window depends on it. Bearing assembly P-214 is the suspect.',
    timestamp: TS(55),
  },
  {
    id: 'm-12',
    channelId: 'cmd-eng',
    senderId: 'KE',
    senderName: 'Sqn Ldr. K. engine Lead',
    senderRole: 'engineer',
    text: 'Commander copy. Vibration signature points to the bearing housing, not the nozzle. P-214 is not held at Tezpur — requesting transfer from Base A. Expecting 2.5 hr logistics lag.',
    timestamp: TS(50),
  },
  {
    id: 'm-13',
    channelId: 'cmd-eng',
    senderId: 'KE',
    senderName: 'Sqn Ldr. K. engine Lead',
    senderRole: 'engineer',
    text: 'If the transfer clears, hot-section inspection plus bearing swap is a 6-hour job. AC-012 back in the air by first light if parts land tonight.',
    timestamp: TS(44),
  },
  {
    id: 'm-14',
    channelId: 'cmd-eng',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Approved. Raise the P-214 transfer now. I would rather ground AC-012 tonight than risk the sortie window.',
    timestamp: TS(38),
  },

  // LOGISTICS (Commander → Logistics team)
  {
    id: 'm-15',
    channelId: 'cmd-log',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Logistics — expedite P-214 bearing assembly from Base A to Tezpur. AC-012 is on a 9-hour clock. I need confirmation of the transfer ETA.',
    timestamp: TS(62),
  },
  {
    id: 'm-16',
    channelId: 'cmd-log',
    senderId: 'VL',
    senderName: 'Sqn Ldr. V. Logistics',
    senderRole: 'logistics',
    text: 'Commander copy. Transfer request raised at 19:40. Base A holds 4 units; dispatch assigned to Cpl. R. Nair for the run. Estimated arrival 22:10.',
    timestamp: TS(58),
  },
  {
    id: 'm-17',
    channelId: 'cmd-log',
    senderId: 'VL',
    senderName: 'Sqn Ldr. V. Logistics',
    senderRole: 'logistics',
    text: 'Also flagging — FUE-1102 fuel nozzle sets are short by 2 across the depot. If AC-012 needs a nozzle as well, we will have to source from the central store. Will keep you posted.',
    timestamp: TS(52),
  },

  // MAINTENANCE BAY (Engineer internal)
  {
    id: 'm-18',
    channelId: 'eng-bay',
    senderId: 'KE',
    senderName: 'Sqn Ldr. K. engine Lead',
    senderRole: 'engineer',
    text: 'Maintenance Bay — AC-012 booked into Hangar 2 from 20:30. Cpl. Nair leads the hot-section crew. AC-009 hydraulic line inspection also scheduled, same bay, staggered start.',
    timestamp: TS(48),
  },
  {
    id: 'm-19',
    channelId: 'eng-bay',
    senderId: 'TR',
    senderName: 'Tech Sgt. R. Kumar',
    senderRole: 'engineer',
    text: 'Bay copy. Hangar 2 tools checked and calibrated. Borescope staged for the HP compressor inspection on AC-012. AC-009 pressure-decay test kit ready on bench 4.',
    timestamp: TS(42),
  },
  {
    id: 'm-20',
    channelId: 'eng-bay',
    senderId: 'TR',
    senderName: 'Tech Sgt. R. Kumar',
    senderRole: 'engineer',
    text: 'One heads-up — the hydraulic test rig on bench 2 is showing an intermittent leak. We will use bench 4 for AC-009. No impact on AC-012.',
    timestamp: TS(36),
  },

  // TOOL ROOM (Engineer internal)
  {
    id: 'm-21',
    channelId: 'eng-tool',
    senderId: 'TR',
    senderName: 'Tech Sgt. R. Kumar',
    senderRole: 'engineer',
    text: 'Tool Room — P-214 bearing assembly kit pulled and staged for AC-012. Torque wrenches 14, 22 and 36 signed out to Cpl. Nair. Hot-section tooling set B assigned.',
    timestamp: TS(54),
  },
  {
    id: 'm-22',
    channelId: 'eng-tool',
    senderId: 'PR',
    senderName: 'Cpl. P. Rane',
    senderRole: 'engineer',
    text: 'Tool Room copy. Calibration on torque wrench 22 is due next week — still within tolerance for tonight\'s job. I will tag it for recalibration after the job.',
    timestamp: TS(48),
  },

  // HANGAR (Engineer internal)
  {
    id: 'm-23',
    channelId: 'eng-hangar',
    senderId: 'PB',
    senderName: 'Wing Cdr. P. Bansal',
    senderRole: 'commander',
    text: 'Hangar — AC-012 inbound to Hangar 2 at 20:30. AC-014 C-130J also due for a turn-around inspection; schedule it into Hangar 1 after AC-012 clears.',
    timestamp: TS(30),
  },
  {
    id: 'm-24',
    channelId: 'eng-hangar',
    senderId: 'DC',
    senderName: 'Wing Cdr. D. Chauhan',
    senderRole: 'commander',
    text: 'Hangar copy. Hangar 1 cleared for AC-014 from 22:00. AC-014 turn-around is a 4-hour job — crew rostered for the night shift.',
    timestamp: TS(24),
  },

  // PARTS DESK (Engineer internal)
  {
    id: 'm-25',
    channelId: 'eng-parts',
    senderId: 'KE',
    senderName: 'Sqn Ldr. K. engine Lead',
    senderRole: 'engineer',
    text: 'Parts Desk — P-214 bearing assembly requested from Base A. ETA 22:10. Also raising a backup request for FUE-1102 nozzle set from the central store in case AC-012 needs it.',
    timestamp: TS(58),
  },
  {
    id: 'm-26',
    channelId: 'eng-parts',
    senderId: 'PR',
    senderName: 'Cpl. P. Rane',
    senderRole: 'engineer',
    text: 'Parts Desk copy. P-214 line shows 4 units at Base A, 0 at Tezpur. FUE-1102 shows 2 short across the depot. Central store hold is 6 — will request 2 on overnight transfer.',
    timestamp: TS(52),
  },

  // DEPOT (Logistics internal)
  {
    id: 'm-27',
    channelId: 'log-depot',
    senderId: 'VL',
    senderName: 'Sqn Ldr. V. Logistics',
    senderRole: 'logistics',
    text: 'Depot — tonight\'s run sheet: P-214 bearing from Base A to Tezpur (priority 1), FUE-1102 nozzle set from central store to Tezpur (priority 2). Both on Cpl. Nair\'s truck.',
    timestamp: TS(60),
  },
  {
    id: 'm-28',
    channelId: 'log-depot',
    senderId: 'AM',
    senderName: 'Wing Cdr. Arjun Mehta',
    senderRole: 'commander',
    text: 'Depot copy. Priority 1 must land by 22:10. If the truck is delayed, fall back to the helicopter courier on standby.',
    timestamp: TS(56),
  },

  // STORE (Logistics internal)
  {
    id: 'm-29',
    channelId: 'log-store',
    senderId: 'VL',
    senderName: 'Sqn Ldr. V. Logistics',
    senderRole: 'logistics',
    text: 'Store — FUE-1102 nozzle sets: 6 at central store, 2 at Base A, 0 at Tezpur. Overnight transfer of 2 units approved. Stock level after transfer: 4 at central, 2 at Base A, 2 at Tezpur.',
    timestamp: TS(50),
  },
  {
    id: 'm-30',
    channelId: 'log-store',
    senderId: 'SL',
    senderName: 'Cpl. S. Logistics',
    senderRole: 'logistics',
    text: 'Store copy. P-214 bearing assemblies: 4 at Base A, 1 at Base B, 0 elsewhere. Central store holds 0 — this is a field-issued item, not held centrally.',
    timestamp: TS(44),
  },

  // DISPATCH (Logistics internal)
  {
    id: 'm-31',
    channelId: 'log-dispatch',
    senderId: 'VL',
    senderName: 'Sqn Ldr. V. Logistics',
    senderRole: 'logistics',
    text: 'Dispatch — tonight\'s priority run is P-214 from Base A to Tezpur. Truck assigned, driver briefed, route cleared. ETD Base A 20:00, ETA Tezpur 22:10.',
    timestamp: TS(58),
  },
  {
    id: 'm-32',
    channelId: 'log-dispatch',
    senderId: 'CN',
    senderName: 'Cpl. R. Nair',
    senderRole: 'logistics',
    text: 'Dispatch copy. Truck fuelled, load sheet ready. P-214 kit staged at Base A despatch bay. I will radio in at the 1-hour mark.',
    timestamp: TS(52),
  },

  // PROCUREMENT (Logistics internal)
  {
    id: 'm-33',
    channelId: 'log-procure',
    senderId: 'VL',
    senderName: 'Sqn Ldr. V. Logistics',
    senderRole: 'logistics',
    text: 'Procurement — FUE-1102 nozzle sets are on a 4-day supplier lead time. Current deficit of 2 sets is covered by the central store tonight, but we should raise a replenishment order for 6 units to restore buffer stock.',
    timestamp: TS(64),
  },
  {
    id: 'm-34',
    channelId: 'log-procure',
    senderId: 'SL',
    senderName: 'Cpl. S. Logistics',
    senderRole: 'logistics',
    text: 'Procurement copy. Raising PO for 6 x FUE-1102 tonight. Supplier acknowledges 4-day lead time. Expedite fee quoted at 1.5x if we need it in 48 hours — holding for Commander sign-off.',
    timestamp: TS(58),
  },
];

/* ---------- helpers ---------- */

export function messagesForChannel(channelId: string): CommMessage[] {
  return SEED_MESSAGES.filter((m) => m.channelId === channelId);
}

export function formatMessageTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
