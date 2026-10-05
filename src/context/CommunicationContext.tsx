'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { channelsForRole, type Channel, type CommMessage, SEED_MESSAGES } from '@/data/communicationChannels';
import type { Role } from '@/data/types';

/* ============================================================
   CommunicationContext — cross-role messaging state.

   Persisted to localStorage so demo messages survive page
   reloads. Seed messages are merged in once per channel so a
   fresh user always sees a populated, realistic thread.
   ============================================================ */

export interface PersistedMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: number;
}

interface CommunicationContextValue {
  role: Role;
  channels: Channel[];
  selectedChannelId: string | null;
  selectChannel: (id: string | null) => void;
  messages: PersistedMessage[];
  sendMessage: (channelId: string, text: string, senderId: string, senderName: string, senderRole: Role) => void;
  pendingText: string;
  setPendingText: (t: string) => void;
  submitPending: () => void;
}

const CommunicationContext = createContext<CommunicationContextValue | null>(null);

const STORAGE_KEY = 'vayu_sewa_comm_messages';

function loadPersisted(): PersistedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePersisted(messages: PersistedMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage may be unavailable in some embeds — non-fatal
  }
}

function mergeSeeds(
  existing: PersistedMessage[],
  channelIds: string[]
): PersistedMessage[] {
  const existingIds = new Set(existing.map((m) => m.id));
  const needed = SEED_MESSAGES.filter((m) => channelIds.includes(m.channelId) && !existingIds.has(m.id));
  if (needed.length === 0) return existing;
  const merged = [...needed, ...existing];
  // keep chronological order
  merged.sort((a, b) => a.timestamp - b.timestamp);
  return merged;
}

function senderFor(role: Role): { id: string; name: string; role: Role } {
  if (role === 'commander') {
    return { id: 'AM', name: 'Wing Cdr. Arjun Mehta', role: 'commander' };
  }
  if (role === 'engineer') {
    return { id: 'KE', name: 'Sqn Ldr. K. Engine Lead', role: 'engineer' };
  }
  return { id: 'VL', name: 'Sqn Ldr. V. Logistics', role: 'logistics' };
}

export function CommunicationProvider({ children, role }: { children: ReactNode; role: Role }) {
  const mySender = useMemo(() => senderFor(role), [role]);

  const channels = useMemo(() => channelsForRole(role), [role]);
  const channelIds = useMemo(() => channels.map((c) => c.id), [channels]);

  const [persisted, setPersisted] = useState<PersistedMessage[]>(() => {
    const existing = loadPersisted();
    return mergeSeeds(existing, channelIds);
  });

  // default receiver per role — the channel a user lands in when they first
  // open Communications
  const DEFAULT_CHANNEL: Record<Role, string | null> = {
    commander: 'cmd-eng',   // ENGINEER is the default receiver for the Commander
    engineer:  'eng-bay',   // Maintenance Bay for Engineers
    logistics: 'log-dispatch', // Dispatch for Logistics
  };

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(() => {
    return DEFAULT_CHANNEL[role] ?? (channels.length ? channels[0].id : null);
  });

  const [pendingText, setPendingText] = useState('');

  // persist every mutation
  useEffect(() => {
    savePersisted(persisted);
  }, [persisted]);

  const selectChannel = useCallback((id: string | null) => {
    setSelectedChannelId(id);
  }, []);

  const addMessage = useCallback(
    (msg: Omit<PersistedMessage, 'id'>) => {
      const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const next: PersistedMessage = { ...msg, id };
      setPersisted((prev) => {
        const merged = [...prev, next];
        merged.sort((a, b) => a.timestamp - b.timestamp);
        return merged;
      });
      return id;
    },
    []
  );

  const sendMessage = useCallback(
    (channelId: string, text: string, senderId: string, senderName: string, senderRole: Role) => {
      if (!text.trim()) return;
      addMessage({
        channelId,
        senderId,
        senderName,
        senderRole,
        text: text.trim(),
        timestamp: Date.now(),
      });
    },
    [addMessage]
  );

  const submitPending = useCallback(() => {
    const text = pendingText.trim();
    if (!text || !selectedChannelId) return;
    sendMessage(selectedChannelId, text, mySender.id, mySender.name, mySender.role);
    setPendingText('');
  }, [pendingText, selectedChannelId, sendMessage, mySender]);

  const value = useMemo<CommunicationContextValue>(
    () => ({
      role,
      channels,
      selectedChannelId,
      selectChannel,
      messages: persisted,
      sendMessage,
      pendingText,
      setPendingText,
      submitPending,
    }),
    [role, channels, selectedChannelId, persisted, sendMessage, pendingText, submitPending, mySender]
  );

  return <CommunicationContext.Provider value={value}>{children}</CommunicationContext.Provider>;
}

export function useCommunication(): CommunicationContextValue {
  const ctx = useContext(CommunicationContext);
  if (!ctx) throw new Error('useCommunication must be used inside CommunicationProvider');
  return ctx;
}
