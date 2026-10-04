'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Plane } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { DASHBOARD_NAMES } from '@/components/layout/Sidebar';
import GlobalSearch from '@/components/layout/GlobalSearch';
import NotificationsPanel from '@/components/layout/NotificationsPanel';
import { RoleBadge } from '@/components/shared/Badge';
import { initials } from '@/utils/helpers';

/* ============================================================
   Sticky top navigation — logo, global search, bell, user
   ============================================================ */

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!user) return null;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="fixed top-0 inset-x-0 h-[57px] bg-white/95 backdrop-blur border-b border-slate-100 z-40">
        <div className="h-full flex items-center justify-between pl-5 pr-4">
          {/* left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/${user.role}`)}
              className="flex items-center gap-2.5 group"
              aria-label="Vayu Sewa home"
            >
              <span className="w-8 h-8 rounded-md bg-navy flex items-center justify-center text-white group-hover:bg-navy-hover transition-colors">
                <Plane size={16} strokeWidth={2} />
              </span>
              <span className="text-[15px] font-bold text-navy tracking-tight">Vayu Sewa</span>
            </button>
            <span className="h-5 w-px bg-slate-200" />
            <span className="text-sm text-slate-500 font-medium hidden sm:block">
              {DASHBOARD_NAMES[user.role]}
            </span>
          </div>

          {/* right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 text-slate-400 hover:border-navy/40 hover:text-navy transition-colors"
              aria-label="Open global search"
            >
              <Search size={14} />
              <span className="text-xs">Search…</span>
              <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1 py-0.5 ml-4">Ctrl K</kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-md text-slate-500 hover:bg-cloud"
              aria-label="Search"
            >
              <Search size={17} />
            </button>

            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 rounded-md text-slate-500 hover:bg-cloud hover:text-navy transition-colors"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
            >
              <Bell size={17} />
              {unread > 0 ? (
                <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-bad text-white text-[9px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center">
                {initials(user.name)}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <div className="mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-md text-slate-400 hover:text-bad hover:bg-bad/5 transition-colors"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
