'use client';

import React from 'react';
import { Clock, MessageSquare, Activity, ChevronRight, Zap } from 'lucide-react';
import type { LiveMatchData, MatchEvent } from '@stadiummind/shared';
import { cn } from '@/lib/utils';

export function LiveMatchCenter({ liveData, homeTeam, awayTeam }: { liveData?: LiveMatchData; homeTeam: string; awayTeam: string }) {
  const score = liveData?.score || { home: 0, away: 0, minute: 0, period: 'Pre-Match' };
  const events = liveData?.events || [];
  const activePlayers = liveData?.players || [];
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Scoreboard Header */}
      <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-xl font-bold border border-white/20">
              {homeTeam.substring(0, 3).toUpperCase()}
            </div>
            <span className="mt-2 text-sm font-semibold">{homeTeam}</span>
          </div>
          
          <div className="flex flex-col items-center px-4">
            <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              {score.period} {score.minute > 0 ? `${score.minute}'` : ''}
            </div>
            <div className="text-5xl font-black tabular-nums tracking-tighter drop-shadow-md">
              {score.home} - {score.away}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-xl font-bold border border-white/20">
              {awayTeam.substring(0, 3).toUpperCase()}
            </div>
            <span className="mt-2 text-sm font-semibold">{awayTeam}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {/* Timeline / Events */}
        <div className="flex-1 p-5 overflow-auto">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Match Events
          </h3>
          {events.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-6">No major events yet.</div>
          ) : (
            <div className="space-y-4">
              {events.slice().reverse().map((event: MatchEvent) => (
                <div key={event.id} className="flex gap-3 text-sm">
                  <div className="w-10 text-right font-bold text-blue-600 shrink-0">{event.minute}'</div>
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">
                      {event.type === 'goal' ? '⚽ Goal' : event.type === 'yellow_card' ? '🟨 Yellow Card' : event.type === 'red_card' ? '🟥 Red Card' : event.type === 'substitution' ? '🔄 Sub' : '⚡ Action'}
                    </span>
                    <p className="text-slate-600 mt-0.5">{event.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Commentary */}
        <div className="flex-1 p-5 bg-slate-50 overflow-auto">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> AI Commentary
          </h3>
          {(liveData?.events?.filter(e => e.type === 'commentary').length ?? 0) > 0 ? (
            <div className="space-y-4">
              {liveData!.events.filter(e => e.type === 'commentary').slice().reverse().map((comm: MatchEvent, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                      {comm.minute}'
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Auto-generated</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{comm.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-6 flex flex-col items-center">
              <Zap className="w-6 h-6 text-slate-300 mb-2" />
              AI Commentary will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
