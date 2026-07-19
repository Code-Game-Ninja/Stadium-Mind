'use client';

import { useEffect, useState } from 'react';
import type { MatchWithStadium } from '@stadiummind/shared';
import { api } from '@/lib/api';
import { LoginGate, LogoutButton } from '@/components/LoginGate';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';
import { PageShell } from '@/components/ui';
import { CalendarDays, UserCircle2 } from 'lucide-react';

export default function OrganizerPage() {
  return (
    <LoginGate role="admin" title="Organizer sign in">
      {(session, onLogout) => <OrganizerShell email={session.email} onLogout={onLogout} />}
    </LoginGate>
  );
}

function OrganizerShell({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const [matchId, setMatchId] = useState<string>('');

  useEffect(() => {
    api.getMatches().then((r) => {
      setMatches(r.matches);
      if (r.matches[0]) setMatchId(r.matches[0].id);
    });
  }, []);

  useEffect(() => {
    if (matchId) {
      localStorage.setItem('stadiummind:active_match_id', matchId);
      window.dispatchEvent(new Event('stadiummind:match_changed'));
    }
  }, [matchId]);

  return (
    <div className="flex min-h-full w-full bg-cream">
      {matchId ? (
        <OrganizerDashboard 
          key={matchId} 
          matchId={matchId} 
          matches={matches}
          setMatchId={setMatchId}
          email={email}
          onLogout={onLogout}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
           <span className="text-slate-500 font-medium">Loading match data...</span>
        </div>
      )}
    </div>
  );
}
