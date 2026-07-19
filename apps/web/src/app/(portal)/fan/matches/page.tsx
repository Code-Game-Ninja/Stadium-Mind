'use client';

import Link from 'next/link';
import { GlobalMatches } from '@/components/GlobalMatches';
import { Globe2, Trophy, Tv, ArrowRight } from 'lucide-react';

const LEAGUES = [
  { name: 'FIFA World Cup 2026', country: '🌍', color: 'bg-ink' },
  { name: 'UEFA Champions League', country: '🇪🇺', color: 'bg-indigo-600' },
  { name: 'Premier League', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: 'bg-purple-600' },
  { name: 'La Liga', country: '🇪🇸', color: 'bg-red-600' },
  { name: 'Bundesliga', country: '🇩🇪', color: 'bg-yellow-600' },
  { name: 'Serie A', country: '🇮🇹', color: 'bg-green-600' },
];

export default function FanMatchesPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
                <Globe2 className="w-6 h-6 text-ink" />
              </div>
              Global Matches
            </h1>
            <p className="text-slate-500 font-medium mt-2">Live scores and results from around the world</p>
          </div>
          
          {/* League Filter */}
          <div className="flex flex-wrap gap-2">
            {LEAGUES.map((league) => (
              <button
                key={league.name}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-full text-sm font-bold text-slate-600 hover:border-lime hover:bg-lime-50 hover:text-ink hover:-translate-y-0.5 shadow-sm transition-all"
              >
                <span className="text-base">{league.country}</span>
                {league.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main Matches List */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-6 bg-gradient-to-r from-ink to-ink-800 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
                <div className="flex items-center gap-3 font-black text-lg relative z-10 tracking-tight">
                  <Trophy className="w-6 h-6 text-yellow-400" /> FIFA World Cup 2026
                </div>
                <span className="text-xs font-black bg-white/20 border border-white/10 px-4 py-1.5 rounded-full uppercase tracking-wider relative z-10 backdrop-blur-md">Group Stage</span>
              </div>
              <div className="divide-y divide-slate-100/60 bg-white/40">
                {[
                  { home: 'France', away: 'Spain', score: '1-0', minute: "67'", status: 'live' },
                  { home: 'England', away: 'Argentina', score: '2-2', minute: 'FT', status: 'finished' },
                  { home: 'Brazil', away: 'Japan', score: '-', minute: '19:00', status: 'upcoming' },
                ].map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center px-6 py-5 hover:bg-white transition-colors cursor-pointer group/match"
                  >
                    <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                      <div className="flex items-center gap-4 justify-end">
                        <span className="font-black text-slate-800 text-base group-hover/match:text-ink transition-colors">{match.home}</span>
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200/60 shadow-inner rounded-full flex items-center justify-center text-sm font-black text-slate-500">
                          {match.home.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-center w-24">
                        {match.status === 'live' ? (
                          <div className="bg-lime-50 border border-lime rounded-xl py-2 px-3 shadow-sm">
                            <div className="text-2xl font-black text-ink tabular-nums tracking-tight">{match.score}</div>
                            <div className="text-[10px] font-black text-red-500 animate-pulse uppercase tracking-widest mt-1">Live {match.minute}</div>
                          </div>
                        ) : match.status === 'finished' ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-3">
                            <div className="text-2xl font-black text-slate-500 tabular-nums tracking-tight">{match.score}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{match.minute}</div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-3">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">VS</div>
                            <div className="text-sm font-black text-slate-600">{match.minute}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 justify-start">
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200/60 shadow-inner rounded-full flex items-center justify-center text-sm font-black text-slate-500">
                          {match.away.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-black text-slate-800 text-base group-hover/match:text-ink transition-colors">{match.away}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Leagues */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-slate-100/60 flex items-center gap-3 bg-white/40">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Other Leagues</h3>
              </div>
              <div className="divide-y divide-slate-100/60 bg-white/20">
                {[
                  { league: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', home: 'Arsenal', away: 'Chelsea', score: '2-1', minute: "78'" },
                  { league: '🇪🇸 La Liga', home: 'Real Madrid', away: 'Barcelona', score: '0-0', minute: 'HT' },
                  { league: '🇩🇪 Bundesliga', home: 'Bayern Munich', away: 'Dortmund', score: '3-1', minute: 'FT' },
                  { league: '🇮🇹 Serie A', home: 'Juventus', away: 'AC Milan', score: '0-2', minute: "12'" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors cursor-pointer group">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{m.league}</div>
                      <div className="text-base font-black text-slate-800 group-hover:text-purple-600 transition-colors">{m.home} vs {m.away}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black tabular-nums text-slate-800 bg-slate-100 px-3 py-1 rounded-lg shadow-inner">{m.score}</span>
                      <span className={`text-xs font-black uppercase tracking-widest w-8 text-center ${m.minute === 'FT' || m.minute === 'HT' ? 'text-slate-400' : 'text-red-500 animate-pulse'}`}>
                        {m.minute}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GlobalMatches />
            
            <Link
              href="/"
              className="group block relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 to-blue-950 p-6 sm:p-8 hover:shadow-xl hover:shadow-ink/20 transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/20 blur-2xl rounded-full transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-lime-500/20 border border-lime flex items-center justify-center mb-4">
                    <Globe2 className="w-6 h-6 text-lime-700" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">Your Match Hub</h3>
                  <p className="text-slate-300/80 font-medium text-sm mt-2">
                    Verify tickets, plan your day, and unlock exclusive stadium features.
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-bold text-lime-700 group-hover:text-white transition-colors">Go to Dashboard</span>
                  <div className="w-10 h-10 rounded-full bg-ink text-lime flex items-center justify-center group-hover:bg-lime-500 group-hover:scale-110 transition-all shadow-lg">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
