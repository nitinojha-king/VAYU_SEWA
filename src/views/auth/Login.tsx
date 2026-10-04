'use client';

import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plane, Wrench, Package, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/* ============================================================
   Login — closed defence system, mock JWT, no sign-up
   ============================================================ */

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);

  // already signed in → straight to dashboard
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = login(username, password);
    if (!res.ok) {
      setError(res.error ?? 'Login failed');
      setShake((s) => s + 1);
      return;
    }
    setError('');
    navigate(`/${username.trim().toLowerCase()}`, { replace: true });
  };

  const demo = [
    { icon: Plane, role: 'Commander', username: 'commander', tint: 'bg-navy/10 text-navy' },
    { icon: Wrench, role: 'Engineer', username: 'engineer', tint: 'bg-warn/10 text-warn' },
    { icon: Package, role: 'Logistics', username: 'logistics', tint: 'bg-ok/10 text-ok' },
  ];

  const pick = (u: string) => {
    setUsername(u);
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
      {/* logo */}
      <div className="flex items-center gap-3 mb-2 ag-fade">
        <span className="w-11 h-11 rounded-lg bg-navy flex items-center justify-center text-white shadow-sm">
          <Plane size={22} strokeWidth={2} />
        </span>
        <span className="text-2xl font-bold text-navy tracking-tight">Vayu Sewa</span>
      </div>
      <p className="text-sm text-slate-500 mb-8 ag-fade ag-fade-1">
        Predictive Maintenance &amp; Fleet Intelligence
      </p>

      {/* card */}
      <div key={shake} className="ag-card w-full max-w-sm p-7 ag-fade ag-fade-2">
        <h1 className="text-base font-bold text-slate-900">Sign in to your console</h1>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Access is restricted to authorised personnel only.
        </p>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label htmlFor="username" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              User ID
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. commander"
              autoComplete="username"
              className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-10 rounded border border-slate-200 px-3 pr-9 text-sm text-slate-700 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-xs text-bad font-medium bg-bad/5 border border-bad/20 rounded px-3 py-2">{error}</p>
          ) : null}

          <button
            type="submit"
            className="w-full h-10 rounded-md bg-navy text-white text-sm font-semibold hover:bg-navy-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Lock size={14} /> Sign In
          </button>
        </form>
      </div>

      {/* demo credentials */}
      <div className="w-full max-w-sm mt-6 ag-fade ag-fade-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2.5 text-center">
          Demo Credentials — password: demo123
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {demo.map((d) => (
            <button
              key={d.username}
              onClick={() => pick(d.username)}
              className="ag-card p-3 text-center hover:border-navy/40 hover:shadow-md transition-all group"
            >
              <span className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center ${d.tint}`}>
                <d.icon size={17} />
              </span>
              <p className="text-xs font-bold text-slate-800 mt-2">{d.role}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.username}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-8 ag-fade ag-fade-4">
        <ShieldCheck size={12} /> Simulated environment — NASA CMAPSS-derived data. No live aircraft connected.
      </p>
    </div>
  );
}
