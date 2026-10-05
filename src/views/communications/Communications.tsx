'use client';

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { MessageSquare, Send, Paperclip, CheckCheck } from 'lucide-react';
import { useCommunication } from '@/context/CommunicationContext';
import { teamsForRole, channelsInTeam, formatMessageTime, type Channel } from '@/data/communicationChannels';
import type { Role } from '@/data/types';

/* ---------- role → display style ---------- */

const ROLE_STYLE: Record<Role, { dot: string; label: string }> = {
  commander: { dot: 'bg-navy', label: 'COMMANDER' },
  engineer:  { dot: 'bg-warn', label: 'ENGINEER' },
  logistics: { dot: 'bg-navy-soft', label: 'LOGISTICS' },
};

/* ---------- channel chip (left panel) ---------- */

function ChannelChip({ channel, selected, indent, onClick }: {
  channel: Channel;
  selected: boolean;
  /** sub-channel of a team, drawn indented under its team channel */
  indent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg py-2 text-xs font-semibold transition-colors ${
        indent ? 'pl-7 pr-3' : 'px-3'
      } ${
        selected
          ? 'bg-navy text-white border border-navy'
          : 'bg-cloud/40 text-slate-600 border border-transparent hover:bg-cloud hover:text-navy'
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? 'bg-white' : 'bg-current opacity-60'}`} />
        {channel.name}
      </span>
    </button>
  );
}

/* ---------- message row ---------- */

function MessageRow({ msg }: { msg: { id: string; senderName: string; senderRole: Role; text: string; timestamp: number } }) {
  const style = ROLE_STYLE[msg.senderRole];
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 pt-0.5">
        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      </div>
      <div className={`flex-1 min-w-0 ${msg.senderRole === 'commander' ? 'md:ml-4' : 'md:ml-0'}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-800">{msg.senderName}</span>
          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${msg.senderRole === 'commander' ? 'bg-navy/10 text-navy' : msg.senderRole === 'engineer' ? 'bg-warn/10 text-warn' : 'bg-navy-soft/10 text-navy'}`}>
            {style.label}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-700 break-words">{msg.text}</p>
        <p className="mt-0.5 text-[9px] text-slate-400 tabular-nums">{formatMessageTime(msg.timestamp)}</p>
      </div>
    </div>
  );
}

/* ---------- composer ---------- */

function Composer({ pendingText, setPendingText, submitPending }: {
  pendingText: string;
  setPendingText: (t: string) => void;
  submitPending: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const keydown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitPending();
      }
    },
    [submitPending]
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(36, el.scrollHeight)}px`;
  }, [pendingText]);

  return (
    <div className="flex items-end gap-2 border-t border-slate-100 bg-white px-3 py-2.5 rounded-b-lg">
      <button
        type="button"
        className="text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="Attach file"
      >
        <Paperclip size={15} />
      </button>
      <div className="flex-1 relative">
        <textarea
          ref={ref}
          value={pendingText}
          onChange={(e) => setPendingText(e.target.value)}
          onKeyDown={keydown}
          placeholder="Write a message…"
          rows={1}
          className="w-full resize-none rounded-lg bg-cloud border border-slate-100 text-xs text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-navy/40 focus:bg-white transition-colors"
          style={{ minHeight: '36px' }}
        />
      </div>
      <button
        type="button"
        onClick={submitPending}
        disabled={!pendingText.trim()}
        className={` shrink-0 rounded-md p-2 transition-colors ${
          pendingText.trim()
            ? 'bg-navy text-white hover:bg-navy-hover'
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
        aria-label="Send message"
      >
        <Send size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/* ---------- empty state ---------- */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-12 h-12 rounded-full bg-cloud flex items-center justify-center mb-3">
        <MessageSquare size={20} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Choose a channel</p>
      <p className="mt-1 text-xs text-slate-400 max-w-[220px]">
        Select a team from the left to read and reply to messages.
      </p>
    </div>
  );
}

/* ---------- main view ---------- */

export default function Communications() {
  const {
    role,
    channels,
    selectedChannelId,
    selectChannel,
    messages,
    pendingText,
    setPendingText,
    submitPending,
    sendMessage,
  } = useCommunication();

  const currentChannel = channels.find((c) => c.id === selectedChannelId) ?? null;
  const thread = currentChannel ? messages.filter((m) => m.channelId === currentChannel.id) : [];

  const teams = teamsForRole(role);

  // auto-scroll to bottom of thread when new messages arrive
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread.length]);

  // focus composer when switching channels
  useEffect(() => {
    if (currentChannel) {
      // small delay so the scroll settles first
      const t = setTimeout(() => {
        const area = document.querySelector('textarea[placeholder="Write a message…"]') as HTMLTextAreaElement | null;
        area?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [currentChannel?.id]);

  if (!currentChannel) {
    return (
      <div className="h-full flex">
        {/* sidebar is still visible so the user can pick a channel */}
        <div className="w-56 shrink-0 border-r border-slate-100 bg-cloud/30 overflow-y-auto">
          {teams.map((team) => (
            <div key={team} className="border-b border-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {team}
              </p>
              {channelsInTeam(role, team).map((ch) => (
                <ChannelChip
                  key={ch.id}
                  channel={ch}
                  selected={ch.id === selectedChannelId}
                  indent={ch.name !== team}
                  onClick={() => selectChannel(ch.id)}
                />
              ))}
            </div>
          ))}
        </div>
        <main className="flex-1 flex items-center justify-center">
          <EmptyState />
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* ---------- left panel: channel tree ---------- */}
      <div className="w-56 shrink-0 border-r border-slate-100 bg-cloud/30 overflow-y-auto">
        {/* role banner */}
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${ROLE_STYLE[role].dot}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {role === 'commander' ? 'Commander' : role === 'engineer' ? 'Engineer' : 'Logistics'}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
            {role === 'commander'
              ? 'Broadcast to all teams and squadrons.'
              : role === 'engineer'
              ? 'Maintenance, tool room, hangar and parts channels.'
              : 'Depot, store, dispatch and procurement channels.'}
          </p>
        </div>

        {/* team groups */}
        {teams.map((team) => (
          <div key={team} className="border-b border-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {team}
            </p>
            {channelsInTeam(role, team).map((ch) => (
              <ChannelChip
                key={ch.id}
                channel={ch}
                selected={ch.id === selectedChannelId}
                indent={ch.name !== team}
                onClick={() => selectChannel(ch.id)}
              />
            ))}
          </div>
        ))}

        {/* footer hint */}
        <div className="px-3 py-3 border-t border-slate-100">
          <p className="text-[9px] text-slate-400 leading-relaxed">
            Messages are role-scoped and persisted for the demo session.
          </p>
        </div>
      </div>

      {/* ---------- right panel: thread ---------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* thread header */}
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {currentChannel.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentChannel.name === currentChannel.team
                  ? `${currentChannel.team} team channel`
                  : currentChannel.team}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cloud text-slate-400">
                <CheckCheck size={10} strokeWidth={2.5} />
              </span>
              <span>{thread.length} {thread.length === 1 ? 'message' : 'messages'}</span>
            </div>
          </div>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 space-y-4">
          {thread.map((msg) => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* recipient strip — makes the destination explicit before sending */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">To</span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${ROLE_STYLE[role].dot}`} />
          <span className="text-[11px] font-bold text-slate-700">{currentChannel.name}</span>
          <span className="text-[10px] text-slate-400">· messages are delivered to this channel only</span>
        </div>

        {/* composer */}
        <Composer
          pendingText={pendingText}
          setPendingText={setPendingText}
          submitPending={submitPending}
        />
      </div>
    </div>
  );
}
