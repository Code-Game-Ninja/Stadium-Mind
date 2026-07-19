'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';

const MOCK_GLOBAL_MATCHES = [
  { id: '1', league: 'Premier League', home: 'Arsenal', away: 'Chelsea', score: '2-1', status: '78\'' },
  { id: '2', league: 'La Liga', home: 'Real Madrid', away: 'Barcelona', score: '0-0', status: 'HT' },
  { id: '3', league: 'Champions League', home: 'Bayern Munich', away: 'PSG', score: '3-1', status: 'FT' },
  { id: '4', league: 'Serie A', home: 'Juventus', away: 'AC Milan', score: '0-2', status: '12\'' },
];

export function GlobalMatches() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2 text-sm">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-ink text-lime">
            <Globe className="w-4 h-4" />
          </span>
          Global Matches
        </h3>
        <Link
          href="/fan/matches"
          className="text-[11px] font-black uppercase tracking-wide text-ink hover:text-lime-700 underline decoration-lime decoration-2 underline-offset-2 flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-2">
        {MOCK_GLOBAL_MATCHES.map((match) => {
          const isLive = match.status !== 'FT' && match.status !== 'HT';
          return (
            <div
              key={match.id}
              className="p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  {match.league}
                </div>
                <div className="flex flex-col gap-1 text-sm font-bold text-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{match.home}</span>
                    <span className="tabular-nums text-slate-900">{match.score.split('-')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{match.away}</span>
                    <span className="tabular-nums text-slate-900">{match.score.split('-')[1]}</span>
                  </div>
                </div>
              </div>

              <div className="ml-4 pl-4 border-l border-slate-100 flex flex-col items-center justify-center shrink-0 w-12">
                <span
                  className={`text-[11px] font-black tabular-nums px-2 py-1 rounded-lg ${
                    isLive ? 'bg-lime text-ink animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {match.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
