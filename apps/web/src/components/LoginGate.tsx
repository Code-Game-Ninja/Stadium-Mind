'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppRole } from '@stadiummind/shared';
import { onAuthStateChanged, logout, type Session } from '@/lib/auth';
import { LogOut } from 'lucide-react';

export function LoginGate({
  role,
  title, // kept for backward compatibility with current usages
  children,
}: {
  role: AppRole | AppRole[];
  title?: string;
  children: (session: Session, onLogout: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((s) => {
      if (!s) {
        // Not logged in -> redirect to login
        router.replace('/login');
        return;
      }

      // Check if user has required role
      const roles = Array.isArray(role) ? role : [role];
      if (roles.includes(s.role)) {
        setSession(s);
        setReady(true);
      } else {
        // Redirect to their actual role page
        if (s.role === 'admin') router.replace('/organizer');
        else if (s.role === 'volunteer') router.replace('/volunteer');
        else router.replace('/fan/dashboard');
      }
    });

    return () => unsubscribe();
  }, [role, router]);

  async function handleLogout() {
    await logout();
    setSession(null);
    router.replace('/login');
  }

  if (!ready || !session) return null; // Show nothing while checking auth

  return <>{children(session, handleLogout)}</>;
}

export function LogoutButton({ onLogout, label = 'Sign Out' }: { onLogout: () => void; label?: string }) {
  return (
    <button
      onClick={onLogout}
      className="flex items-center justify-center h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors gap-2"
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
