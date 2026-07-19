// Sportmonks v3 live-football integration.
// Pulls REAL match data: in-play fixtures first (true live scores/minutes/events),
// falling back to the latest finished fixture so the demo always has real data.
// No synthetic stats — anything Sportmonks doesn't provide is left honest/empty.

import { LiveMatchData, LiveScore, Player, MatchEvent } from '@stadiummind/shared';

const API_KEY = process.env.SPORTMONKS_API_KEY;
const BASE_URL = 'https://api.sportmonks.com/v3/football';

let cachedLive: LiveMatchData | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

// Sportmonks position_id groups → our positions
function mapPosition(positionId?: number): Player['position'] {
  switch (positionId) {
    case 24: return 'GK';
    case 25: return 'DEF';
    case 26: return 'MID';
    case 27: return 'FWD';
    default: return 'MID';
  }
}

// Sportmonks state ids: 1 NS, 2 1st half, 3 HT, 4 2nd half break?, 5 FT, 22 2nd half...
function mapPeriod(stateId?: number, minute?: number): LiveScore['period'] {
  switch (stateId) {
    case 1: return 'Pre-Match';
    case 2: return '1H';
    case 3: return 'HT';
    case 22:
    case 4: return '2H';
    case 5:
    case 7: return 'FT';
    default:
      if (!minute) return 'Pre-Match';
      return minute <= 45 ? '1H' : minute >= 90 ? 'FT' : '2H';
  }
}

function mapEventType(typeId?: number): MatchEvent['type'] | null {
  switch (typeId) {
    case 14: case 16: return 'goal';       // goal, penalty goal
    case 19: return 'yellow_card';
    case 20: return 'red_card';
    case 18: return 'substitution';
    default: return null;
  }
}

interface RawFixture {
  id: number;
  name?: string;
  state_id?: number;
  participants?: any[];
  scores?: any[];
  events?: any[];
  lineups?: any[];
  periods?: any[];
}

function currentMinute(fixture: RawFixture): number {
  const ticking = fixture.periods?.find((p: any) => p.ticking);
  if (ticking?.minutes != null) return ticking.minutes;
  const state = fixture.state_id;
  if (state === 5 || state === 7) return 90;
  return 0;
}

function mapFixture(fixture: RawFixture): LiveMatchData | null {
  const home = fixture.participants?.find((p: any) => p.meta?.location === 'home') || fixture.participants?.[0];
  const away = fixture.participants?.find((p: any) => p.meta?.location === 'away') || fixture.participants?.[1];
  if (!home || !away) return null;

  const scoreFor = (participantId: number) =>
    fixture.scores?.find((s: any) => s.description === 'CURRENT' && s.participant_id === participantId)?.score?.goals ?? 0;

  const minute = currentMinute(fixture);

  // Real lineups (when the plan includes them)
  const players: Player[] = (fixture.lineups || []).map((l: any) => ({
    id: String(l.player_id ?? l.id),
    name: l.player_name || l.player?.display_name || l.player?.name || 'Unknown',
    jerseyNumber: l.jersey_number ?? 0,
    position: mapPosition(l.position_id),
    team: l.team_id === home.id ? 'home' : 'away',
    isStarting: l.type_id === 11, // 11 = starting XI, 12 = bench
    photoUrl: l.player?.image_path && !String(l.player.image_path).includes('placeholder') ? l.player.image_path : undefined,
  }));

  // Real match events
  const events: MatchEvent[] = (fixture.events || [])
    .map((e: any): MatchEvent | null => {
      const type = mapEventType(e.type_id);
      if (!type) return null;
      return {
        id: String(e.id),
        matchId: String(fixture.id),
        minute: e.minute ?? 0,
        type,
        team: e.participant_id === home.id ? 'home' : 'away',
        player1Id: e.player_id ? String(e.player_id) : undefined,
        player2Id: e.related_player_id ? String(e.related_player_id) : undefined,
        text: e.info || `${e.player_name || 'Player'} — ${type.replace('_', ' ')}${e.result ? ` (${e.result})` : ''}`,
        isAiGenerated: false,
        createdAt: new Date().toISOString(),
      };
    })
    .filter((e: MatchEvent | null): e is MatchEvent => e !== null)
    .sort((a: MatchEvent, b: MatchEvent) => a.minute - b.minute);

  return {
    matchId: String(fixture.id),
    score: {
      home: scoreFor(home.id),
      away: scoreFor(away.id),
      minute,
      period: mapPeriod(fixture.state_id, minute),
    },
    players,
    events,
    // surfaced to the UI so it can badge the data source honestly
    source: 'sportmonks',
    teams: { home: home.name, away: away.name },
  };
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sportmonks ${res.status}: ${res.statusText}`);
  return res.json();
}

const INCLUDES = 'participants;scores;events;lineups;periods';

export async function fetchLiveMatch(): Promise<LiveMatchData | null> {
  if (!API_KEY) return null;

  const now = Date.now();
  if (cachedLive && now - lastFetchTime < CACHE_TTL) {
    return cachedLive;
  }

  try {
    // 1. Prefer genuinely in-play fixtures (real live score + running minute).
    const inplay = await fetchJson(`${BASE_URL}/livescores/inplay?api_token=${API_KEY}&include=${INCLUDES}`);
    let fixture: RawFixture | undefined = (inplay.data || [])[0];

    // 2. Otherwise fall back to the latest fixture with real final data.
    if (!fixture) {
      const latest = await fetchJson(`${BASE_URL}/fixtures/latest?api_token=${API_KEY}&include=${INCLUDES}`);
      fixture = (Array.isArray(latest.data) ? latest.data : [latest.data]).filter(Boolean)[0];
    }
    if (!fixture) return cachedLive;

    const mapped = mapFixture(fixture);
    if (mapped) {
      cachedLive = mapped;
      lastFetchTime = now;
    }
    return cachedLive;
  } catch (error) {
    console.error('Failed to fetch from Sportmonks:', error);
    return cachedLive;
  }
}
