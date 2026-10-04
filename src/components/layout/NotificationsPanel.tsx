'use client';

import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { timeAgo } from '@/utils/helpers';
import SlideOver from '@/components/shared/SlideOver';
import EmptyState from '@/components/shared/EmptyState';
import type { NotificationType } from '@/data/types';

/* ============================================================
   Notification centre — bell slide-over with live feed
   ============================================================ */

const TYPE_ICON: Record<NotificationType, { icon: typeof AlertTriangle; cls: string }> = {
  alert: { icon: AlertTriangle, cls: 'bg-bad/10 text-bad' },
  warning: { icon: AlertCircle, cls: 'bg-warn/10 text-warn' },
  success: { icon: CheckCircle, cls: 'bg-ok/10 text-ok' },
  info: { icon: Info, cls: 'bg-navy/10 text-navy' },
};

export default function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
      width="max-w-sm"
      footer={
        <button
          onClick={markAllNotificationsRead}
          className="w-full h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
        >
          Mark all as read
        </button>
      }
    >
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="Live ops updates will appear here." />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const { icon: Icon, cls } = TYPE_ICON[n.type];
            return (
              <li
                key={n.id}
                className={`group relative rounded-lg border p-3 transition-colors ${
                  n.read ? 'border-slate-100 bg-white' : 'border-navy/15 bg-cloud'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.timestamp)}</p>
                  </div>
                  {!n.read ? (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="absolute top-2 right-2 p-1 rounded text-slate-300 hover:text-navy hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SlideOver>
  );
}
