'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { MatchWithStadium } from '@stadiummind/shared';
import { formatKickoff } from '@/lib/utils';
import { CalendarDays, MapPin, ChevronRight, Trophy, Filter } from 'lucide-react';

const STAGES = ['All', 'Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];

export default function FanSchedulePage() {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'live' | 'scheduled' | 'completed'>('All');

  useEffect(() => {
    api.getMatches()
      .then((r) => setMatches(r.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? matches : matches.filter((m) => m.status === filter);

  return (
    <>
      <div className="max-w-5xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-ink" />
              </div>
              Match Schedule
            </h1>
            <p className="text-slate-500 font-medium mt-2">All fixtures — live, upcoming, and completed</p>
          </div>
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-slate-200/60 p-2 rounded-2xl shadow-sm">
            <Filter className="w-5 h-5 text-slate-400 ml-2" />
            <div className="flex gap-1.5 flex-wrap">
              {(['All', 'live', 'scheduled', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                    filter === s
                      ? 'bg-ink text-lime shadow-md shadow-ink/20'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matches */}
        {loading ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 p-16 text-center text-slate-400 font-medium animate-pulse">
            Loading schedule…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CalendarDays className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">No matches found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="divide-y divide-slate-100/60 bg-white/40">
              {filtered.map((m) => (
                <Link
                  key={m.id}
                  href={`/match/${m.id}/ticket`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-6 sm:px-8 py-6 hover:bg-white/60 transition-colors group"
                >
                  {/* Date badge */}
                  <div className="hidden sm:flex flex-col items-center justify-center w-20 h-20 shrink-0 bg-lime-50 border border-lime rounded-2xl text-center group-hover:scale-105 transition-transform shadow-sm">
                    <div className="text-xs font-black text-ink-700 uppercase tracking-widest mb-1">
                      {new Date(m.kickoffAt).toLocaleDateString('en', { month: 'short' })}
                    </div>
                    <div className="text-3xl font-black text-ink leading-none tracking-tight">
                      {new Date(m.kickoffAt).getDate()}
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                          m.status === 'live'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse'
                            : m.status === 'completed'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-lime-50 text-ink border border-lime'
                        }`}
                      >
                        {m.status === 'live' ? '🔴 LIVE' : m.status === 'completed' ? 'FT' : m.stage}
                      </span>
                      {m.status !== 'completed' && m.status !== 'live' && (
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" /> {formatKickoff(m.kickoffAt)}
                        </span>
                      )}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-ink transition-colors">
                      {m.homeTeam} <span className="text-slate-400 font-normal mx-2 text-lg">vs</span> {m.awayTeam}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400" /> {m.stadium.name}, {m.stadium.hostCity}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0">
                    <div
                      className="inline-flex items-center gap-2 text-sm font-bold text-ink bg-lime-50 px-5 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all"
                    >
                      <Trophy className="w-4 h-4" /> Verify Ticket
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-ink transition-colors">
                      <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-sm font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" /> Live now
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500 shadow-sm shadow-lime/50" /> Upcoming
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm" /> Completed
          </div>
        </div>
      </div>
    </>
  );
}
