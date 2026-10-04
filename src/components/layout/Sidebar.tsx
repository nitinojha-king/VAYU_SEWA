'use client';

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Shield,
  AlertTriangle,
  FileText,
  Activity,
  Gauge,
  Brain,
  Wrench,
  History,
  Sparkles,
  Users,
  Package2,
  Package,
  CalendarDays,
  ShoppingCart,
  Truck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/data/types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  commander: [
    { to: '/commander', label: 'Fleet Overview', icon: LayoutDashboard, end: true },
    { to: '/commander/map', label: 'Aircraft Status Map', icon: Map },
    { to: '/commander/readiness', label: 'Mission Readiness', icon: Shield },
    { to: '/commander/alerts', label: 'Critical Alerts', icon: AlertTriangle },
    { to: '/commander/reports', label: 'Reports', icon: FileText },
  ],
  engineer: [
    { to: '/engineer', label: 'Aircraft Health', icon: Activity, end: true },
    { to: '/engineer/sensors', label: 'Live Sensor Data', icon: Gauge },
    { to: '/engineer/predictions', label: 'Fault Predictions', icon: Brain },
    { to: '/engineer/workorders', label: 'Work Orders', icon: Wrench },
    { to: '/engineer/history', label: 'Maintenance History', icon: History },
    { to: '/engineer/recommendations', label: 'AI Recommendations', icon: Sparkles },
    { to: '/engineer/crew', label: 'Crew & Workload', icon: Users },
  ],
  logistics: [
    { to: '/logistics', label: 'Inventory Overview', icon: Package2, end: true },
    { to: '/logistics/parts', label: 'Parts Inventory', icon: Package },
    { to: '/logistics/demand', label: 'Upcoming Demand', icon: CalendarDays },
    { to: '/logistics/procurement', label: 'Procurement Alerts', icon: ShoppingCart },
    { to: '/logistics/tracking', label: 'Procurement Tracking', icon: Truck },
    { to: '/logistics/analytics', label: 'Parts Analytics', icon: BarChart3 },
    { to: '/logistics/reports', label: 'Reports', icon: FileText },
  ],
};

export const DASHBOARD_NAMES: Record<Role, string> = {
  commander: 'Fleet Command Center',
  engineer: 'Maintenance Operations',
  logistics: 'Spares & Logistics',
};

export default function Sidebar({ role }: { role: Role }) {
  const location = useLocation();
  const items = NAV_ITEMS[role];

  return (
    <aside className="fixed left-0 top-[57px] bottom-0 w-60 bg-white border-r border-slate-100 overflow-y-auto ag-scroll z-30 hidden md:block">
      <nav className="py-4" aria-label="Dashboard navigation">
        {items.map((item) => {
          const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-[3px] transition-all ${
                active
                  ? 'border-navy text-navy bg-cloud'
                  : 'border-transparent text-slate-500 hover:bg-cloud hover:text-navy'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-5 py-6 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-ok ag-blink" />
          Live sensor feed active
        </div>
        <p className="text-[10px] text-slate-300 mt-2 leading-relaxed">
          Data streams every 2s from the on-board sensor simulator.
        </p>
      </div>
    </aside>
  );
}
