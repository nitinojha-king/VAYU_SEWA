'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MockUser } from '@/data/types';

/* ============================================================
   Mock JWT auth — closed defence system, no sign-up
   ============================================================ */

export const MOCK_USERS: MockUser[] = [
  { id: 1, name: 'Wing Cdr. Arjun Mehta', role: 'commander', username: 'commander' },
  { id: 2, name: 'Sqn Ldr. Priya Sharma', role: 'engineer', username: 'engineer' },
  { id: 3, name: 'Flt Lt. Rohan Verma', role: 'logistics', username: 'logistics' },
];

const DEMO_PASSWORD = 'demo123';
const AUTH_KEY = 'vayu_sewa_auth_token';

interface AuthContextValue {
  user: MockUser | null;
  ready: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function fakeJwt(user: MockUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({ sub: user.username, uid: user.id, role: user.role, iat: Date.now() })
  );
  return `${header}.${payload}.MOCK-SIGNATURE`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // lazy session restore (runs client-side only — app is loaded with ssr:false)
  const [user, setUser] = useState<MockUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const token = JSON.parse(raw) as { username: string };
        return MOCK_USERS.find((u) => u.username === token.username) ?? null;
      }
    } catch {
      /* ignore corrupt token */
    }
    return null;
  });
  const ready = true;

  const login = useCallback((username: string, password: string) => {
    const found = MOCK_USERS.find((u) => u.username === username.trim().toLowerCase());
    if (!found) return { ok: false, error: 'Unknown user ID. Access is restricted to authorised personnel.' };
    if (password !== DEMO_PASSWORD) return { ok: false, error: 'Incorrect password. Please retry.' };
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: fakeJwt(found), username: found.username }));
    setUser(found);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
