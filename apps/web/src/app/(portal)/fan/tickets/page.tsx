'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { MatchWithStadium } from '@stadiummind/shared';
import { formatKickoff } from '@/lib/utils';
import {
  Ticket,
  MapPin,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Plus,
  ChevronRight,
  Trophy,
} from 'lucide-react';

const DEMO_TICKET_IDS = ['WC2026-453621', 'WC2026-918284', 'WC2026-777111'];

export default function FanTicketsPage() {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const storedMatchId =
    typeof window !== 'undefined' ? localStorage.getItem('stadiummind:active_match_id') : null;
  const storedTicket =
    typeof window !== 'undefined' ? localStorage.getItem('stadiummind:verified_ticket') : null;

  useEffect(() => {
    api.getMatches().then((r) => setMatches(r.matches)).catch(() => {});
  }, []);

  const activeMatch = matches.find((m) => m.id === storedMatchId);

  return (
    <>
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in-fast">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Tickets</h1>
            <p className="text-slate-500 font-medium mt-1">Your digital match day passes</p>
          </div>
          {storedMatchId && (
            <Link
              href={`/match/${storedMatchId}/ticket`}
              className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-lime font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-ink/20 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" /> Add Ticket
            </Link>
          )}
        </div>

        {/* Verified Ticket */}
        {storedTicket && activeMatch && storedMatchId ? (
          <div className="bg-gradient-to-br from-slate-900 via-ink-800 to-ink rounded-[2rem] p-8 sm:p-10 text-white overflow-hidden relative shadow-2xl group transition-all">
            {/* Glowing orbs */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-lime-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-lime-500/30 transition-all duration-500" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4" /> Verified Match Ticket
                </div>
                <QrCode className="w-12 h-12 text-lime-700/40 opacity-50" />
              </div>

              <div className="mb-10">
                <div className="text-xs font-black uppercase tracking-widest text-lime-700/70 mb-2">Digital Ticket ID</div>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-lime-200">
                  {storedTicket}
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Match</div>
                  <div className="font-black text-sm">{activeMatch.homeTeam} vs {activeMatch.awayTeam}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Venue</div>
                  <div className="font-black text-sm">{activeMatch.stadium.name}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kickoff</div>
                  <div className="font-black text-sm">{formatKickoff(activeMatch.kickoffAt)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stage</div>
                  <div className="font-black text-sm">{activeMatch.stage}</div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/match/${storedMatchId}/journey`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-lime-500 hover:bg-blue-400 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                >
                  <Trophy className="w-5 h-5" /> Open Match Hub
                </Link>
                <Link
                  href={`/match/${storedMatchId}/explore`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 font-bold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  <MapPin className="w-5 h-5" /> Explore Stadium
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border-2 border-dashed border-slate-300/80 p-12 text-center hover:border-lime transition-colors">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Ticket className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">No verified tickets yet</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
              Enter your ticket ID or scan your QR code to verify your ticket and unlock your match day journey.
            </p>
            {matches[0] && (
              <Link
                href={`/match/${matches[0].id}/ticket`}
                className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-lime font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-ink/20 hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-5 h-5" /> Verify a Ticket <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        )}

        {/* Demo Tickets Reference */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 border-b border-slate-100/60 bg-white/40">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-ink-700" /> Demo Ticket IDs
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Use these to try the ticket verification flow</p>
          </div>
          <div className="divide-y divide-slate-100/60">
            {DEMO_TICKET_IDS.map((id) => (
              <div key={id} className="flex items-center justify-between px-6 py-5 group hover:bg-white/60 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-slate-400 group-hover:text-ink-700 transition-colors" />
                  </div>
                  <span className="font-mono font-black text-slate-700 text-lg tracking-tight">{id}</span>
                </div>
                {matches[0] && (
                  <Link
                    href={`/match/${matches[0].id}/ticket`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-ink bg-lime-50 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all"
                  >
                    Verify <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
