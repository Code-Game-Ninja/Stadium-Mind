'use client';

import Link from 'next/link';
import { Globe2, Users, ArrowRight } from 'lucide-react';

const MATCHES = [
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', home: 'France', away: 'Spain', stage: 'Group Stage', status: 'live' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', home: 'England', away: 'Argentina', stage: 'Group Stage', status: 'finished' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', home: 'Brazil', away: 'Japan', stage: 'Group Stage', status: 'upcoming' },
];

export default function FanPlayersPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-ink" />
            </div>
            Global Rosters
          </h1>
          <p className="text-slate-500 font-medium mt-2">Select a match to view team rosters and player information.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MATCHES.map((match) => (
            <Link
              key={match.id}
              href={`/match/${match.id}/players`}
              className="group bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-ink/5 hover:-translate-y-1 transition-all flex flex-col relative"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-colors pointer-events-none" />

              <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-white/40 relative z-10">
                <StatusBadge status={match.status} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{match.stage}</span>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-center relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl shadow-inner flex items-center justify-center text-xl font-black text-slate-400 border border-slate-200/60 group-hover:border-lime group-hover:text-ink transition-colors">
                      {match.home.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-black text-slate-800 text-center tracking-tight">{match.home}</span>
                  </div>

                  <div className="px-4 text-xs font-black text-slate-300 uppercase tracking-widest">VS</div>

                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl shadow-inner flex items-center justify-center text-xl font-black text-slate-400 border border-slate-200/60 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                      {match.away.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-black text-slate-800 text-center tracking-tight">{match.away}</span>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-white/40 border-t border-slate-100/60 flex items-center justify-between text-ink font-bold group-hover:bg-lime-50 relative z-10 transition-colors">
                View Rosters
                <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
        <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-500/50 animate-pulse" />
        Live
      </div>
    );
  }
  if (status === 'finished') {
    return (
      <div className="flex items-center gap-2 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
        <div className="w-2 h-2 bg-slate-400 rounded-full" />
        Finished
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-lime-50 text-ink px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-lime">
      <div className="w-2 h-2 bg-lime-500 rounded-full shadow-sm shadow-lime/50" />
      Upcoming
    </div>
  );
}
