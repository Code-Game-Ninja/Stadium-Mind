'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Player, MatchWithStadium } from '@stadiummind/shared';
import { Loader2, Shield, AlertCircle, X, Activity, Trophy, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TEAM_FLAGS: Record<string, string> = {
  'France': 'fr',
  'Spain': 'es',
  'England': 'gb-eng',
  'Argentina': 'ar',
  'Brazil': 'br',
  'Japan': 'jp'
};

function getFlagUrl(teamName: string) {
  const code = TEAM_FLAGS[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

function getMockStats(playerId: string) {
  // deterministic mock generation based on string
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    matches: 10 + (hash % 40),
    goals: hash % 15,
    assists: (hash * 2) % 20,
    yellowCards: hash % 5,
    redCards: hash % 2,
    rating: (6 + ((hash % 40) / 10)).toFixed(1)
  };
}

export default function PlayersPage({ params }: { params: { matchId: string } }) {
  const [match, setMatch] = useState<MatchWithStadium | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [matchRes, playersRes] = await Promise.all([
          api.getMatch(params.matchId),
          api.getMatchPlayers(params.matchId),
        ]);
        setMatch(matchRes.match);
        setPlayers(playersRes.players || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.matchId]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ink" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900">Oops, something went wrong</h2>
        <p className="mt-2 text-slate-500">{error || 'Match not found'}</p>
        <Link href="/fan/matches" className="btn-primary mt-6">
          View All Matches
        </Link>
      </div>
    );
  }

  const homePlayers = players.filter(p => p.team === 'home');
  const awayPlayers = players.filter(p => p.team === 'away');
  
  const currentPlayers = activeTab === 'home' ? homePlayers : awayPlayers;
  const starters = currentPlayers.filter(p => p.isStarting);
  const subs = currentPlayers.filter(p => !p.isStarting);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-ink">Team Rosters</h1>
        <div className="mt-3 flex items-center gap-4 text-lg text-slate-600 font-semibold bg-white/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200/50 shadow-sm inline-flex">
          <div className="flex items-center gap-2">
            {getFlagUrl(match.homeTeam) && (
              <img src={getFlagUrl(match.homeTeam)!} alt={match.homeTeam} className="w-6 h-auto rounded-sm shadow-sm" />
            )}
            <span className="text-ink">{match.homeTeam}</span>
          </div>
          <span className="text-slate-400 text-sm">VS</span>
          <div className="flex items-center gap-2">
            {getFlagUrl(match.awayTeam) && (
              <img src={getFlagUrl(match.awayTeam)!} alt={match.awayTeam} className="w-6 h-auto rounded-sm shadow-sm" />
            )}
            <span className="text-ink">{match.awayTeam}</span>
          </div>
          <span className="ml-4 px-3 py-1 bg-lime/20 text-ink-700 text-xs rounded-full uppercase tracking-widest">{match.stage}</span>
        </div>
      </div>

      <div className="mb-8 flex space-x-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-200/60 p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all",
            activeTab === 'home' 
              ? "bg-ink text-lime shadow-md" 
              : "text-slate-600 hover:bg-slate-100 hover:text-ink"
          )}
        >
          {getFlagUrl(match.homeTeam) && (
            <img src={getFlagUrl(match.homeTeam)!} alt="" className="w-5 h-auto rounded-sm" />
          )}
          {match.homeTeam}
        </button>
        <button
          onClick={() => setActiveTab('away')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all",
            activeTab === 'away' 
              ? "bg-ink text-lime shadow-md" 
              : "text-slate-600 hover:bg-slate-100 hover:text-ink"
          )}
        >
          {getFlagUrl(match.awayTeam) && (
            <img src={getFlagUrl(match.awayTeam)!} alt="" className="w-5 h-auto rounded-sm" />
          )}
          {match.awayTeam}
        </button>
      </div>

      {players.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center">
          <p className="text-slate-500 font-medium">Rosters are not available for this match yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-ink tracking-tight">
              <Shield className="h-6 w-6 text-lime-600" /> Starting XI
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {starters.map(player => (
                <PlayerCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-xl font-black text-ink tracking-tight">Substitutes</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subs.map(player => (
                <PlayerCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (
        <PlayerProfileModal 
          player={selectedPlayer} 
          teamName={selectedPlayer.team === 'home' ? match.homeTeam : match.awayTeam}
          onClose={() => setSelectedPlayer(null)} 
        />
      )}
    </>
  );
}

function PlayerCard({ player, onClick }: { player: Player, onClick: () => void }) {
  const avatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=transparent`;
  const imgUrl = player.photoUrl || avatarUrl;
  return (
    <button 
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 shadow-sm transition-all hover:shadow-xl hover:shadow-ink/5 hover:-translate-y-1 text-left"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100/80 group-hover:bg-lime-50 transition-colors border border-slate-200/50 group-hover:border-lime/30">
        <img src={imgUrl} alt={player.name} className="object-cover w-full h-full" />
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-black text-lime border-2 border-white">
          {player.jerseyNumber}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="truncate font-bold text-ink group-hover:text-ink-800">{player.name}</h3>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{player.position}</p>
      </div>
    </button>
  );
}

function PlayerProfileModal({ player, teamName, onClose }: { player: Player, teamName: string, onClose: () => void }) {
  const stats = { ...getMockStats(player.id), ...(player.stats || {}) };
  const avatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=transparent`;
  const imgUrl = player.photoUrl || avatarUrl;
  const flagUrl = getFlagUrl(teamName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-[2rem] bg-white shadow-2xl animate-scale-in overflow-hidden border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative h-48 bg-gradient-to-br from-ink to-ink-800 p-8 flex items-end">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-lime via-transparent to-transparent" />
          
          <div className="relative z-10 flex items-end gap-6 w-full">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-slate-50 border-4 border-white shadow-xl relative transform translate-y-8">
              <img src={imgUrl} alt={player.name} className="w-full h-full object-cover" />
            </div>
            <div className="pb-2 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-1 rounded-md bg-lime text-ink text-xs font-black uppercase tracking-widest">
                  #{player.jerseyNumber}
                </span>
                {flagUrl && <img src={flagUrl} alt={teamName} className="h-4 rounded-sm shadow-sm" />}
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">{player.name}</h2>
              <p className="text-lime-200 font-medium">{player.position} · {teamName}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pt-16 pb-8 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Matches</span>
              </div>
              <div className="text-2xl font-black text-ink">{('matches' in stats) ? stats.matches : '-'}</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Avg Rating</span>
              </div>
              <div className="text-2xl font-black text-ink">{('rating' in stats) ? stats.rating : '-'}</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Trophy className="h-4 w-4 text-lime-600" />
                <span className="text-xs font-bold uppercase tracking-widest">Goals</span>
              </div>
              <div className="text-2xl font-black text-ink">{stats.goals}</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <div className="h-4 w-4 rounded-sm bg-lime-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Assists</span>
              </div>
              <div className="text-2xl font-black text-ink">{stats.assists}</div>
            </div>
          </div>

          <div className="mt-4 flex gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Yellow Cards</span>
              <div className="flex items-center gap-2">
                <div className="h-4 w-3 bg-yellow-400 rounded-sm shadow-sm" />
                <span className="text-xl font-black text-ink">{stats.yellowCards}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Red Cards</span>
              <div className="flex items-center gap-2">
                <div className="h-4 w-3 bg-red-500 rounded-sm shadow-sm" />
                <span className="text-xl font-black text-ink">{stats.redCards}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
