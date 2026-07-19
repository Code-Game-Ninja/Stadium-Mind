'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { MatchWithStadium } from '@stadiummind/shared';
import { api } from '@/lib/api';
import { formatKickoff, cn } from '@/lib/utils';
import { Panel, SectionHeader, StatusChip, Skeleton, EmptyState } from '@/components/ui';
import {
  MapPin,
  CalendarDays,
  Ticket,
  Compass,
  Building2,
  Filter,
  Search,
  CalendarX,
} from 'lucide-react';

// Deterministic team accent mapped to soft light colors.
const TEAM_ACCENT: Record<string, string> = {
  France: 'bg-blue-50/80 text-blue-700 border-blue-200',
  Spain: 'bg-red-50/80 text-red-700 border-red-200',
  England: 'bg-slate-150 text-slate-800 border-slate-300',
  Argentina: 'bg-sky-50/80 text-sky-700 border-sky-200',
  Brazil: 'bg-yellow-50/80 text-yellow-750 border-yellow-250',
  Japan: 'bg-rose-50/80 text-rose-700 border-rose-200',
};

function accent(name: string) {
  return TEAM_ACCENT[name] || 'bg-slate-50 text-slate-700 border-slate-300';
}

export function MatchHubSection() {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('all');
  const [stadium, setStadium] = useState('all');
  const [lookupId, setLookupId] = useState('');

  useEffect(() => {
    api
      .getMatches()
      .then((r) => setMatches(r.matches))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => Array.from(new Set(matches.map((m) => m.stadium.hostCity))), [matches]);
  const stadiums = useMemo(() => Array.from(new Set(matches.map((m) => m.stadium.name))), [matches]);

  const filtered = matches.filter(
    (m) => (city === 'all' || m.stadium.hostCity === city) && (stadium === 'all' || m.stadium.name === stadium)
  );

  return (
    <section id="match-hub" className="scroll-mt-20">
      <SectionHeader
        eyebrow="Start the demo"
        title="Live Match Hub"
        description="Pick a FIFA World Cup 2026 match to plan your match day or explore the stadium. Fans never log in — verify a demo ticket for a personalized journey."
        action={
          <div className="flex items-center gap-2">
            <StatusChip tone="green">{matches.length || '—'} matches</StatusChip>
            <StatusChip tone="blue">3 stadiums</StatusChip>
          </div>
        }
      />

      {/* Quick Ticket Lookup */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-[250px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Quick Ticket Lookup</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="input flex-1 font-mono text-sm max-w-sm" 
              placeholder="Enter Match ID (e.g. match-1)"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
            <Link 
              href={lookupId ? `/match/${lookupId}/ticket` : '#'} 
              className={cn("btn-primary", !lookupId && "opacity-50 pointer-events-none")}
            >
              <Ticket className="h-4 w-4" /> View Ticket
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
        <span className="flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" /> Filter
        </span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <select
            className="input min-w-[170px] pl-8 text-xs font-semibold py-1.5"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Filter by host city"
          >
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <select
            className="input min-w-[170px] pl-8 text-xs font-semibold py-1.5"
            value={stadium}
            onChange={(e) => setStadium(e.target.value)}
            aria-label="Filter by stadium"
          >
            <option value="all">All stadiums</option>
            {stadiums.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {(city !== 'all' || stadium !== 'all') && (
          <button
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => {
              setCity('all');
              setStadium('all');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-5 bg-white">
              <Skeleton className="mb-4 h-5 w-24" />
              <div className="mb-4 flex justify-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="mt-5 h-9 w-full" />
            </Panel>
          ))}
        </div>
      )}

      {error && (
        <Panel className="p-6 text-sm text-signal-red bg-white">
          Could not reach the API: {error}. Make sure the backend is running on port 4000 (
          <code className="font-mono bg-slate-50 px-1 rounded border">npm run dev:api</code>).
        </Panel>
      )}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <MatchCard key={m.id} match={m} index={i} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Panel className="py-4 bg-white">
          <EmptyState icon={<CalendarX className="h-6 w-6" />}>No matches match this filter.</EmptyState>
        </Panel>
      )}
    </section>
  );
}

function MatchCard({ match, index }: { match: MatchWithStadium; index: number }) {
  const statusTone = match.status === 'live' ? 'red' : 'blue';
  return (
    <article
      className="panel card-hover bg-white flex flex-col overflow-hidden p-5 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <StatusChip tone="slate">{match.stage}</StatusChip>
        <StatusChip tone={statusTone}>{match.status === 'scheduled' ? 'Scheduled' : match.status}</StatusChip>
      </div>

      <div className="mb-4 flex items-center justify-center gap-4 py-1">
        <TeamBadge name={match.homeTeam} />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">vs</span>
        </div>
        <TeamBadge name={match.awayTeam} />
      </div>

      <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{match.stadium.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{match.stadium.hostCity}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{formatKickoff(match.kickoffAt)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/match/${match.id}/ticket`} className="btn-primary text-xs">
          <Ticket className="h-3.5 w-3.5" /> Ticket
        </Link>
        <Link href={`/match/${match.id}/explore`} className="btn-ghost text-xs">
          <Compass className="h-3.5 w-3.5" /> Explore
        </Link>
      </div>
    </article>
  );
}

function TeamBadge({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border text-[11px] font-bold ${accent(
          name
        )}`}
      >
        {name.slice(0, 3).toUpperCase()}
      </div>
      <span className="text-xs font-semibold text-slate-700">{name}</span>
    </div>
  );
}
