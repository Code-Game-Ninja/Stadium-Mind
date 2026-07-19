'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GlobalMatches } from '@/components/GlobalMatches';
import { api } from '@/lib/api';
import { onAuthStateChanged } from '@/lib/auth';
import { useMatchSnapshot } from '@/lib/useSocket';
import type { MatchWithStadium, LiveScore } from '@stadiummind/shared';
import { formatKickoff } from '@/lib/utils';
import {
  Trophy,
  Ticket,
  MapPin,
  ChevronRight,
  Zap,
  CalendarDays,
  ShieldCheck,
  ArrowRight,
  PlayCircle,
  Cloud,
} from 'lucide-react';

const BADGE_COLORS = [
  'from-[#191A23] to-[#3A3B49]',
  'from-[#2E2F3B] to-[#191A23]',
  'from-[#84CC16] to-[#4D7C0F]',
  'from-[#3A3B49] to-[#23242F]',
  'from-[#65A30D] to-[#365314]',
  'from-[#23242F] to-[#2E2F3B]',
];

const MATCHES_CACHE_KEY = 'stadiummind:matches_cache_v1';

function teamColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

function TeamBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-base',
  };
  return (
    <span
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${teamColor(
        name
      )} text-white font-black flex items-center justify-center ring-2 ring-white/30 shrink-0 uppercase`}
    >
      {name.slice(0, 3)}
    </span>
  );
}

function kickoffTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ---------- Skeletons (premium shimmer while data loads) ---------- */

function HeroSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/70 shadow-sm min-h-[280px] p-7 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-20 rounded-lg" />
        <div className="skeleton h-4 w-32 rounded-md" />
      </div>
      <div className="flex items-center justify-center gap-10 py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="skeleton w-14 h-14 rounded-full" />
          <div className="skeleton h-3.5 w-16 rounded-md" />
        </div>
        <div className="skeleton h-10 w-16 rounded-xl" />
        <div className="flex flex-col items-center gap-2">
          <div className="skeleton w-14 h-14 rounded-full" />
          <div className="skeleton h-3.5 w-16 rounded-md" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-10 w-32 rounded-xl" />
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}

function SideCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5 flex-1 min-h-[130px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex -space-x-2">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="skeleton w-8 h-8 rounded-full" />
        </div>
        <div className="skeleton h-6 w-14 rounded-lg" />
      </div>
      <div className="space-y-2 mt-3">
        <div className="skeleton h-3 w-20 rounded-md" />
        <div className="skeleton h-4 w-36 rounded-md" />
      </div>
      <div className="skeleton h-7 w-20 rounded-lg mt-3" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
      <div className="skeleton h-4 w-24 rounded-md" />
      <div className="skeleton h-6 w-16 rounded-full mx-auto" />
      <div className="skeleton h-4 w-24 rounded-md ml-auto" />
      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function FanDashboardPage() {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [volCapacity, setVolCapacity] = useState(0);
  const [storedMatchId, setStoredMatchId] = useState<string | null>(null);
  const [storedTicket, setStoredTicket] = useState<string | null>(null);

  useEffect(() => {
    setStoredMatchId(localStorage.getItem('stadiummind:active_match_id'));
    setStoredTicket(localStorage.getItem('stadiummind:verified_ticket'));

    // Instant paint from session cache, then revalidate in the background.
    try {
      const cached = sessionStorage.getItem(MATCHES_CACHE_KEY);
      if (cached) {
        setMatches(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      /* ignore corrupt cache */
    }

    api.getMatches()
      .then((r) => {
        setMatches(r.matches);
        try {
          sessionStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(r.matches));
        } catch {
          /* storage full — skip */
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!storedMatchId) return;
    api.getMatch(storedMatchId)
      .then((data) => {
        if (data.volunteerCapacity !== undefined) setVolCapacity(data.volunteerCapacity);
      })
      .catch(console.error);
  }, [storedMatchId]);

  // Announce fan presence to the organizer's Active Fans tab on login — even
  // before they verify a ticket. Fires once the Firebase session resolves.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((session) => {
      if (!session || session.role !== 'fan') return;
      const matchId = localStorage.getItem('stadiummind:active_match_id') ?? undefined;
      api
        .fanPresence({ uid: session.uid, name: session.displayName, matchId })
        .catch(() => {});
    });
    return () => unsubscribe();
  }, []);

  // Live hero score: subscribe to the match room so a goal pushed by the
  // organizer's Live Match Controller ticks up here in real time.
  const { snapshot: liveSnapshot } = useMatchSnapshot(storedMatchId ?? undefined);
  const liveScore: LiveScore | null = liveSnapshot?.liveMatchData?.score ?? null;

  const { activeMatch, heroMatch, heroMatchId, sideMatches, scheduleMatches } = useMemo(() => {
    const active = matches.find((m) => m.id === storedMatchId);
    const hero = active ?? matches.find((m) => m.status === 'live');
    return {
      activeMatch: active,
      heroMatch: hero,
      heroMatchId: hero?.id ?? storedMatchId,
      sideMatches: matches
        .filter((m) => m.status !== 'completed' && m.id !== hero?.id)
        .slice(0, 2),
      scheduleMatches: matches.slice(0, 6),
    };
  }, [matches, storedMatchId]);

  return (
    <div className="w-full space-y-8">
      {/* Heading */}
      <div className="rise">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Matches</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">
          Welcome back — your match day hub for live scores, tickets, and more.
        </p>
      </div>

      {/* Hero row: featured match + side fixture cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Featured match card */}
        <div className="rise" style={{ '--rise-delay': '60ms' } as React.CSSProperties}>
          {loading && !heroMatch ? (
            <HeroSkeleton />
          ) : heroMatch ? (
            <div className="relative overflow-hidden rounded-3xl bg-ink text-white shadow-2xl shadow-black/40 group min-h-[280px] flex flex-col justify-between p-7 transition-shadow duration-500 hover:shadow-black/60 will-change-transform">
              {/* Decorative pitch glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-lime/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-lime/20 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-lime/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

              {/* Top row: LIVE badge + venue */}
              <div className="relative z-10 flex items-center justify-between">
                {heroMatch.status === 'live' ? (
                  <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-lime text-ink text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    <Zap className="w-3 h-3 fill-current" /> {activeMatch ? 'Your Match' : 'Featured'}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <MapPin className="w-3.5 h-3.5" /> {heroMatch.stadium.name}
                </span>
              </div>

              {/* Center: teams + score */}
              <div className="relative z-10 flex items-center justify-center gap-6 sm:gap-10 py-6">
                <div className="flex flex-col items-center gap-2 w-28 transition-transform duration-300 group-hover:-translate-x-1">
                  <TeamBadge name={heroMatch.homeTeam} size="lg" />
                  <span className="text-sm font-bold text-center leading-tight">{heroMatch.homeTeam}</span>
                </div>
                <div className="flex flex-col items-center">
                  {heroMatch.status === 'live' && liveScore && heroMatch.id === storedMatchId ? (
                    <>
                      <div className="text-5xl font-black tabular-nums tracking-tight">
                        {liveScore.home}
                        <span className="text-lime/60 mx-2">:</span>
                        {liveScore.away}
                      </div>
                      <span className="mt-2 text-xs font-bold text-lime uppercase tracking-widest animate-pulse">
                        {liveScore.period} · {liveScore.minute}&apos;
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-black text-lime/70 tracking-widest">VS</div>
                      <span className="mt-2 text-xs font-semibold text-slate-300">
                        {formatKickoff(heroMatch.kickoffAt)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 w-28 transition-transform duration-300 group-hover:translate-x-1">
                  <TeamBadge name={heroMatch.awayTeam} size="lg" />
                  <span className="text-sm font-bold text-center leading-tight">{heroMatch.awayTeam}</span>
                </div>
              </div>

              {/* Bottom: CTAs */}
              <div className="relative z-10 flex flex-wrap items-center gap-3">
                <Link
                  href={heroMatchId ? `/match/${heroMatchId}/journey` : '/fan/matches'}
                  className="inline-flex items-center gap-2 bg-lime hover:bg-white text-ink text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-lime/20 hover:shadow-white/20 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <PlayCircle className="w-4 h-4" /> Live Match
                </Link>
                <Link
                  href={heroMatchId ? `/match/${heroMatchId}/explore` : '/fan/matches'}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <MapPin className="w-4 h-4" /> Explore Stadium
                </Link>
                <span className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Trophy className="w-3.5 h-3.5" /> {heroMatch.stage}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/70 p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[280px]">
              <Trophy className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-slate-800 font-bold">No Active Match</h3>
              <p className="text-slate-500 text-sm mt-1">
                Select a match to unlock your digital experience.
              </p>
            </div>
          )}
        </div>

        {/* Side fixture cards */}
        <div className="flex flex-col gap-5">
          {loading && sideMatches.length === 0 ? (
            <>
              <div className="rise" style={{ '--rise-delay': '120ms' } as React.CSSProperties}>
                <SideCardSkeleton />
              </div>
              <div className="rise" style={{ '--rise-delay': '180ms' } as React.CSSProperties}>
                <SideCardSkeleton />
              </div>
            </>
          ) : (
            <>
              {sideMatches.map((m, i) => {
                const isPrimary = i === 0;
                return (
                  <div
                    key={m.id}
                    className={`rise relative overflow-hidden rounded-3xl p-5 flex-1 flex flex-col justify-between min-h-[130px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl will-change-transform ${
                      isPrimary
                        ? 'bg-lime text-ink shadow-lg shadow-lime/30 hover:shadow-lime/50'
                        : 'bg-white border border-slate-200/70 text-slate-900 shadow-sm'
                    }`}
                    style={{ '--rise-delay': `${120 + i * 60}ms` } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex -space-x-2">
                        <TeamBadge name={m.homeTeam} size="sm" />
                        <TeamBadge name={m.awayTeam} size="sm" />
                      </div>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg tabular-nums ${
                          isPrimary ? 'bg-ink/10 text-ink' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {kickoffTime(m.kickoffAt)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${isPrimary ? 'text-ink/60' : 'text-slate-400'}`}>
                        {m.stage}
                      </div>
                      <div className="font-bold text-sm mt-0.5 leading-tight">
                        {m.homeTeam} <span className={isPrimary ? 'opacity-60' : 'text-slate-400'}>vs</span> {m.awayTeam}
                      </div>
                      <div className={`text-xs font-medium mt-0.5 ${isPrimary ? 'text-ink/70' : 'text-slate-400'}`}>
                        {m.stadium.name}
                      </div>
                    </div>
                    <Link
                      href={`/match/${m.id}/ticket`}
                      className={`mt-3 inline-flex items-center gap-1.5 self-start text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all duration-200 active:scale-[0.97] ${
                        isPrimary
                          ? 'bg-ink hover:bg-ink-700 text-lime'
                          : 'bg-ink hover:bg-ink-700 text-white'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Watch
                    </Link>
                  </div>
                );
              })}
              {!loading && sideMatches.length === 0 && (
                <div className="rise rounded-3xl bg-white border border-slate-200/70 p-6 shadow-sm flex-1 flex flex-col items-center justify-center text-center">
                  <CalendarDays className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No other fixtures right now.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Volunteer banner */}
      {volCapacity > 0 && (
        <div className="rise bg-ink rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden group shadow-lg shadow-black/30">
          <div className="absolute right-0 top-0 w-40 h-40 bg-lime/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-lime flex items-center justify-center text-ink shrink-0 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Volunteer Opportunities Available</h3>
              <p className="text-sm font-medium text-white/70 mt-0.5">
                {volCapacity} seats open. Help out and earn rewards!
              </p>
            </div>
          </div>
          <Link
            href="/fan/volunteer-apply"
            className="relative z-10 px-6 py-3 bg-lime hover:bg-white text-ink text-sm font-bold rounded-2xl transition-all duration-200 shadow-lg shrink-0 whitespace-nowrap hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Schedule table + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Schedule */}
        <div
          className="rise bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden"
          style={{ '--rise-delay': '240ms' } as React.CSSProperties}
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Match Schedule</h2>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-ink text-lime flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </span>
              <Link
                href="/fan/schedule"
                className="inline-flex items-center gap-1 px-4 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors duration-200"
              >
                All Matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading && scheduleMatches.length === 0 ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : scheduleMatches.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-slate-400">No matches scheduled.</div>
            ) : (
              scheduleMatches.map((m) => (
                <div
                  key={m.id}
                  className="px-6 py-4 grid grid-cols-[1fr_auto_1fr] sm:grid-cols-[1fr_auto_1fr_auto] items-center gap-3 hover:bg-slate-50/80 transition-colors duration-200 group"
                >
                  {/* Home */}
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamBadge name={m.homeTeam} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                        {m.stadium.hostCity}
                      </div>
                      <div className="font-black text-slate-900 text-sm uppercase truncate">{m.homeTeam}</div>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div className="flex justify-center">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap ${
                        m.status === 'live'
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/25 animate-pulse'
                          : m.status === 'completed'
                            ? 'bg-ink text-lime shadow-md shadow-black/20'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {m.status === 'live' ? 'Live' : m.status === 'completed' ? 'Final' : kickoffTime(m.kickoffAt)}
                    </span>
                  </div>

                  {/* Away */}
                  <div className="flex items-center justify-end gap-3 min-w-0">
                    <div className="min-w-0 text-right">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                        {m.stage}
                      </div>
                      <div className="font-black text-slate-900 text-sm uppercase truncate">{m.awayTeam}</div>
                    </div>
                    <TeamBadge name={m.awayTeam} size="sm" />
                  </div>

                  {/* Venue + link */}
                  <div className="hidden sm:flex flex-col items-end w-40 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 truncate max-w-full">
                      {m.stadium.name}
                    </span>
                    <Link
                      href={`/match/${m.id}/ticket`}
                      className="text-[11px] font-black text-ink hover:text-lime-700 underline decoration-lime decoration-2 underline-offset-2 uppercase tracking-wide inline-flex items-center gap-1 mt-0.5 transition-colors duration-200"
                    >
                      Match Center <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Ticket status card */}
          <Link
            href={storedMatchId ? `/match/${storedMatchId}/ticket` : '/fan/tickets'}
            className="rise block relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-lg group hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 will-change-transform"
            style={{ '--rise-delay': '300ms' } as React.CSSProperties}
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-lime/15 rounded-full blur-2xl -translate-y-1/3 translate-x-1/4 group-hover:bg-lime/25 transition-colors duration-500" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Ticket Status
                </div>
                <div className={`font-black text-lg mt-1 ${storedTicket ? 'text-lime' : 'text-white'}`}>
                  {storedTicket ? 'Verified ✓' : 'Not Verified'}
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                  storedTicket ? 'bg-lime/20 text-lime' : 'bg-white/10 text-slate-300'
                }`}
              >
                <Ticket className="w-6 h-6" />
              </div>
            </div>
          </Link>

          {/* Global matches */}
          <div className="rise" style={{ '--rise-delay': '360ms' } as React.CSSProperties}>
            <GlobalMatches />
          </div>

          {/* Quick actions */}
          <div
            className="rise grid grid-cols-2 gap-3"
            style={{ '--rise-delay': '420ms' } as React.CSSProperties}
          >
            {[
              { icon: Ticket, label: 'My Tickets', href: '/fan/tickets' },
              { icon: CalendarDays, label: 'Schedule', href: '/fan/schedule' },
              { icon: Trophy, label: 'All Matches', href: '/fan/matches' },
              {
                icon: MapPin,
                label: 'Stadium Map',
                href: storedMatchId ? `/match/${storedMatchId}/explore` : '/fan/matches',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="bg-white rounded-2xl border border-slate-200/70 p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 group will-change-transform"
                >
                  <div className="w-10 h-10 rounded-xl bg-lime/30 text-ink flex items-center justify-center group-hover:bg-ink group-hover:text-lime group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
