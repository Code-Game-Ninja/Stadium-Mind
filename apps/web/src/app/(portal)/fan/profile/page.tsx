'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { MatchWithStadium } from '@stadiummind/shared';
import {
  UserCircle,
  Ticket,
  Trophy,
  MapPin,
  Settings,
  ChevronRight,
  ShieldCheck,
  Star,
  Bell,
  Calendar,
} from 'lucide-react';

export default function FanProfilePage() {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const storedTicket =
    typeof window !== 'undefined' ? localStorage.getItem('stadiummind:verified_ticket') : null;
  const storedMatchId =
    typeof window !== 'undefined' ? localStorage.getItem('stadiummind:active_match_id') : null;

  useEffect(() => {
    api.getMatches().then((r) => setMatches(r.matches)).catch(() => {});
  }, []);

  const activeMatch = matches.find((m) => m.id === storedMatchId);

  return (
    <>
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in-fast">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-slate-900 via-ink-800 to-ink rounded-[2rem] p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden shadow-2xl">
          {/* Glowing orbs */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-lime-500/20 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 w-28 h-28 rounded-full bg-ink/30 border-4 border-lime flex items-center justify-center backdrop-blur-md shadow-inner">
            <UserCircle className="w-16 h-16 text-lime-700" />
          </div>
          <div className="relative z-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {storedTicket ? `Fan — ${storedTicket}` : 'Guest Fan'}
            </h1>
            <p className="text-lime-700 font-medium mt-2">StadiumMind Fan Portal Member</p>
            {storedTicket && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full backdrop-blur-md">
                <ShieldCheck className="w-4 h-4" /> Ticket Verified
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Match */}
          {activeMatch && storedMatchId && (
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 p-8 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-lime-50 flex items-center justify-center text-ink group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <h2 className="font-black text-slate-900 tracking-tight text-xl">Active Match</h2>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{activeMatch.homeTeam} vs {activeMatch.awayTeam}</p>
                <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {activeMatch.stadium.name}, {activeMatch.stadium.hostCity}
                </div>
                <Link
                  href={`/match/${storedMatchId}/journey`}
                  className="mt-6 inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-ink transition-colors w-full sm:w-auto justify-center"
                >
                  Open Match Hub <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Fan Preferences */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 p-8 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <h2 className="font-black text-slate-900 tracking-tight text-xl">Fan Preferences</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Football', 'Live Scores', 'AI Commentary', 'Match Alerts'].map((pref) => (
                <div key={pref} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-lime hover:shadow-md transition-all cursor-default">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-sm shadow-lime/50" />
                  <span className="text-sm font-bold text-slate-700">{pref}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 border-b border-slate-100/60 bg-white/40">
            <h2 className="font-black text-slate-900 tracking-tight text-xl">Quick Actions</h2>
          </div>
          <div className="divide-y divide-slate-100/60">
            {[
              { icon: Ticket, label: 'My Tickets', sub: 'View and manage your tickets', href: '/fan/tickets' },
              { icon: Trophy, label: 'Live Matches', sub: 'Check live scores and events', href: '/fan/matches' },
              { icon: Calendar, label: 'Schedule', sub: 'Upcoming fixtures & events', href: '/fan/schedule' },
              { icon: Bell, label: 'Notifications', sub: 'Match alerts and updates', href: '/fan/settings' },
              { icon: Settings, label: 'Settings', sub: 'Preferences & accessibility', href: '/fan/settings' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-6 py-5 hover:bg-white/60 transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-lime-50 group-hover:scale-110 transition-all">
                      <Icon className="w-6 h-6 text-slate-500 group-hover:text-ink transition-colors" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-lg tracking-tight mb-0.5">{item.label}</div>
                      <div className="text-sm text-slate-500 font-medium">{item.sub}</div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover:bg-lime-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-ink-700 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
