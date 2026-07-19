'use client';

import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelHeader, Spinner, EmptyState, StatusChip } from '@/components/ui';
import { api } from '@/lib/api';
import { Activity, MessageSquare, Zap, Users, Play, Save, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MatchWithStadium, LiveScore, Player, LiveMatchData } from '@stadiummind/shared';

const PERIODS: LiveScore['period'][] = ['Pre-Match', '1H', 'HT', '2H', 'FT'];
const PERIOD_LABELS: Record<LiveScore['period'], string> = {
  'Pre-Match': 'Pre-Match',
  '1H': 'First Half',
  HT: 'Half Time',
  '2H': 'Second Half',
  FT: 'Full Time',
};

export function LiveMatchController({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchWithStadium | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<LiveScore['period']>('Pre-Match');

  const [shorthand, setShorthand] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [feed, setFeed] = useState<Pick<LiveMatchData, 'source' | 'teams'>>({});

  const fetchMatch = useCallback(async () => {
    try {
      const [matchRes, playersRes] = await Promise.all([
        api.getMatch(matchId),
        api.getMatchPlayers(matchId).catch(() => ({ players: [] as Player[] })),
      ]);
      setMatch(matchRes.match);
      setPlayers(playersRes.players);
      const live = matchRes.liveMatchData as LiveMatchData | undefined;
      if (live) setFeed({ source: live.source, teams: live.teams });
      if (live?.score) {
        const s = live.score;
        setScoreHome(s.home);
        setScoreAway(s.away);
        setMinute(s.minute);
        setPeriod(s.period);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    setLoading(true);
    fetchMatch();
  }, [fetchMatch]);

  async function handleSaveScore() {
    setSavingScore(true);
    try {
      await api.updateLiveMatch(matchId, {
        score: { home: scoreHome, away: scoreAway, minute, period },
      });
      toast.success('Live score updated — fans see it instantly');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingScore(false);
    }
  }

  async function handleGenerateCommentary(text?: string) {
    const input = (text ?? shorthand).trim();
    if (!input) return;
    setGenerating(true);
    try {
      await api.generateCommentary(matchId, input);
      setShorthand('');
      fetchMatch(); // refresh data to get new events
      toast.success('Commentary generated!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function handleAutoSimulate() {
    if (confirm('Let AI auto-simulate the next match event based on current context?')) {
      handleGenerateCommentary('Auto-simulate next event based on current match context');
    }
  }

  if (loading) return <div className="py-8"><Spinner label="Loading Match Data..." /></div>;

  const homePlayers = players.filter((p) => p.team === 'home' && p.isStarting);
  const awayPlayers = players.filter((p) => p.team === 'away' && p.isStarting);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Score Controller */}
      <Panel className="bg-white">
        <PanelHeader
          title="Live Score Controller"
          icon={<Activity className="h-5 w-5 text-ink" />}
          action={
            feed.source === 'sportmonks' ? (
              <StatusChip tone="green" title={feed.teams ? `Live feed: ${feed.teams.home} vs ${feed.teams.away}` : undefined}>
                ⚽ Sportmonks live
              </StatusChip>
            ) : feed.source === 'manual' ? (
              <StatusChip tone="blue">Manual control</StatusChip>
            ) : (
              <StatusChip tone="slate">Awaiting feed</StatusChip>
            )
          }
        />
        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{match?.homeTeam}</label>
              <input type="number" min={0} className="input mt-1 w-full text-2xl font-black text-center" value={scoreHome} onChange={e => setScoreHome(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
            <div className="text-2xl font-black text-slate-300">-</div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{match?.awayTeam}</label>
              <input type="number" min={0} className="input mt-1 w-full text-2xl font-black text-center" value={scoreAway} onChange={e => setScoreAway(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minute</label>
              <input type="number" min={0} max={130} className="input mt-1 w-full" placeholder="e.g. 47" value={minute} onChange={e => setMinute(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Period</label>
              <select className="input mt-1 w-full" value={period} onChange={e => setPeriod(e.target.value as LiveScore['period'])}>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn-primary w-full" onClick={handleSaveScore} disabled={savingScore}>
            <Save className="h-4 w-4 mr-2" /> {savingScore ? 'Publishing…' : 'Update Score & Time'}
          </button>
        </div>
      </Panel>

      {/* AI Commentary & Simulation */}
      <Panel className="bg-white">
        <PanelHeader title="AI Commentary & Simulation" icon={<Zap className="h-5 w-5 text-ink" />} />
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manual Shorthand</label>
            <p className="text-xs text-slate-400 mb-2">Type a brief event (e.g., &quot;Mbappé shoots from 20 yards, great save&quot;) and AI will generate professional commentary and classify it.</p>
            <textarea
              className="input w-full min-h-[80px]"
              placeholder="Enter event shorthand..."
              value={shorthand}
              onChange={e => setShorthand(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={() => handleGenerateCommentary()} disabled={generating || !shorthand.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" /> {generating ? 'Generating...' : 'Generate & Publish'}
            </button>
            <button className="btn-ghost flex-1" onClick={handleAutoSimulate} disabled={generating}>
              <Play className="h-4 w-4 mr-2" /> Auto-Simulate
            </button>
          </div>
        </div>
      </Panel>

      {/* Lineup Management */}
      <Panel className="bg-white lg:col-span-2">
        <PanelHeader title="Starting Lineups" icon={<Users className="h-5 w-5 text-ink" />} />
        <div className="p-4">
          {players.length === 0 ? (
            <EmptyState icon={<Inbox className="h-6 w-6" />}>
              No lineup data available for this match yet.
            </EmptyState>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { label: match?.homeTeam, list: homePlayers },
                { label: match?.awayTeam, list: awayPlayers },
              ].map((side) => (
                <div key={side.label} className="border border-slate-200 rounded-xl p-3 bg-cream">
                  <h4 className="font-bold text-slate-800 mb-2">{side.label} — Starting XI</h4>
                  <ul className="space-y-1 text-sm text-slate-600 font-medium">
                    {side.list.map((p) => (
                      <li key={p.id} className="flex justify-between items-center p-1.5 hover:bg-white rounded-lg transition-colors">
                        <span>
                          <span className="inline-block w-8 font-black text-ink tabular-nums">{p.jerseyNumber}</span>
                          {p.name}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-ink text-lime px-2 py-0.5 rounded-md">{p.position}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
