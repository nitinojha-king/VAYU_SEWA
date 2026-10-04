'use client';

import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Plane, Activity, Wrench, Package, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { DASHBOARD_NAMES } from '@/components/layout/Sidebar';
import Modal from '@/components/shared/Modal';
import { useAuth } from '@/context/AuthContext';

/* ============================================================
   App shell — sticky navbar + fixed sidebar + routed content
   ============================================================ */

const WELCOME_KEY = 'vayu_sewa_welcome_seen';

const ROLE_STEPS = {
  commander: {
    icon: ShieldCheck,
    text: 'You have full-fleet visibility: health trends, mission readiness and critical alerts — without drowning in raw telemetry.',
  },
  engineer: {
    icon: Wrench,
    text: 'You get live sensor streams, AI fault predictions, a digital twin per airframe and a drag-free kanban for work orders.',
  },
  logistics: {
    icon: Package,
    text: 'You see exactly which parts upcoming work orders will consume — before shortages ground an aircraft.',
  },
} as const;

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [welcome, setWelcome] = useState(false);
  const [prevUser, setPrevUser] = useState(user);

  // one-time welcome modal — adjust state during render (no effect cascade)
  if (user !== prevUser) {
    setPrevUser(user);
    if (user && !localStorage.getItem(WELCOME_KEY)) setWelcome(true);
  }

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (!user) return null;
  const role = user.role as keyof typeof ROLE_STEPS;
  const StepIcon = ROLE_STEPS[role].icon;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Sidebar role={user.role} />

      <main className="md:ml-60 pt-[57px]">
        <div className="p-6 max-w-[1400px]">
          <Outlet />
        </div>
      </main>

      {/* One-time onboarding modal */}
      <Modal
        open={welcome}
        onClose={() => {
          localStorage.setItem(WELCOME_KEY, '1');
          setWelcome(false);
        }}
        title="Welcome to Vayu Sewa"
        subtitle={`Logged in as ${user.name}`}
        footer={
          <button
            onClick={() => {
              localStorage.setItem(WELCOME_KEY, '1');
              setWelcome(false);
            }}
            className="w-full h-10 rounded-md bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition-colors"
          >
            Get Started
          </button>
        }
      >
        <div className="space-y-4">
          {[
            {
              icon: Activity,
              title: 'Live fleet telemetry',
              text: 'Sensors on all 20 aircraft stream every 2 seconds. The anomaly engine raises a prediction after 3 consecutive out-of-range readings.',
            },
            {
              icon: Plane,
              title: 'AI predicts failures early',
              text: 'Machine-learning models trained on CMAPSS-style degradation data estimate time-to-failure per component with confidence scores.',
            },
            {
              icon: StepIcon,
              title: `Your role: ${DASHBOARD_NAMES[user.role]}`,
              text: ROLE_STEPS[role].text,
            },
          ].map((s, i) => (
            <div key={i} className="flex gap-3.5">
              <div className="w-9 h-9 rounded-full bg-navy-soft text-navy flex items-center justify-center shrink-0">
                <s.icon size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
