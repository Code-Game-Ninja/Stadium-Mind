// Store engine that switches between Firebase (Firestore) and In-Memory demo mode.
// Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON to enable Firebase.

import {
  STADIUMS,
  MATCHES,
  TICKETS,
  buildZonesForStadium,
  buildVolunteers,
  buildIncidents,
  buildRecommendations,
  TRANSPORT_DEFAULTS,
  SUSTAINABILITY_DEFAULTS,
  INITIAL_MERCH,
  loadFromOccupancy,
  fallbackAiSummary,
  DEMO_TICKET_IDS,
  type MatchWithStadium,
  type StadiumZone,
  type Volunteer,
  type Incident,
  type Recommendation,
  type ActionHistoryEntry,
  type TimelineEvent,
  type TransportMetrics,
  type SustainabilityMetrics,
  type DashboardSnapshot,
  type Ticket,
  type MerchandiseItem,
  type ActiveGuest,
  type LiveMatchData,
  type StadiumMetrics,
  type MatchProposal,
} from '@stadiummind/shared';
import { db } from './firebase';

const USE_FIREBASE = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Sportmonks serves ONE real in-play fixture at a time (not our fictional World
// Cup matches). Attaching it to every match would show the same score across
// the board, so we mirror it onto a single designated "showcase" match. All
// other matches keep their own seed/manual score. Override via env to point the
// live feed at whichever match you demo.
const LIVE_FEED_MATCH_ID = process.env.LIVE_FEED_MATCH_ID || MATCHES[0]?.id;

let idCounter = 1;
export const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

interface MatchState {
  zones: StadiumZone[];
  volunteers: Volunteer[];
  incidents: Incident[];
  recommendations: Recommendation[];
  actionHistory: ActionHistoryEntry[];
  timeline: TimelineEvent[];
  transport: TransportMetrics;
  sustainability: SustainabilityMetrics;
  weather: StadiumMetrics['weather'];
  // True while a simulation scenario overrides live weather (cleared when the
  // weather recommendation is applied).
  weatherOverride?: boolean;
  powerStatus: StadiumMetrics['powerStatus'];
  merchandise: MerchandiseItem[];
  volunteerCapacity: number;
  activeFans: Map<string, ActiveGuest>;
  liveMatchData?: LiveMatchData;
  // True once an organizer takes manual control of the live feed — blocks the
  // Sportmonks live feed from overwriting manual data.
  manualLive?: boolean;
}

const matchStates = new Map<string, MatchState>();

// Firestore-mode read cache: getMatchState serves the in-memory copy for up to
// STATE_TTL before re-reading the 8 subcollections. All mutators write through
// to this cached object, so it never goes stale from our own writes — the TTL
// only bounds staleness from external writes (e.g. edits in the Firebase
// console). Keeps a live dashboard within the Firestore free-tier quota.
const STATE_TTL = 60 * 1000;
const stateFetchedAt = new Map<string, number>();

// --- IN MEMORY SEEDING ---
function seedMatch(matchId: string): MatchState {
  const match = MATCHES.find((m) => m.id === matchId)!;
  const now = new Date().toISOString();
  const state: MatchState = {
    zones: buildZonesForStadium(match.stadiumId),
    volunteers: buildVolunteers(matchId),
    incidents: buildIncidents(matchId, now),
    recommendations: buildRecommendations(matchId, now),
    actionHistory: [],
    timeline: [
      { id: genId('t'), matchId, kind: 'ai', label: 'Operations monitoring online', detail: 'Digital twin initialized from seed data.', severity: 1, createdAt: now },
    ],
    transport: { ...TRANSPORT_DEFAULTS },
    sustainability: { ...SUSTAINABILITY_DEFAULTS },
    weather: 'clear',
    powerStatus: 'stable',
    merchandise: JSON.parse(JSON.stringify(INITIAL_MERCH)),
    volunteerCapacity: 100,
    activeFans: new Map(),
    liveMatchData: {
      matchId,
      score: { home: 0, away: 0, minute: 0, period: 'Pre-Match' },
      players: [],
      events: [],
      source: 'seed',
    }
  };
  matchStates.set(matchId, state);
  return state;
}

// --- FIREBASE SEEDING (One-time push if empty) ---
async function ensureFirebaseSeeded(matchId: string) {
  const matchRef = db.collection('matches').doc(matchId);
  const doc = await matchRef.get();
  if (doc.exists) return; // already seeded

  console.log(`Seeding Firestore for match ${matchId}...`);
  const memoryState = seedMatch(matchId); // generate seed data

  const batch = db.batch();
  
  // Base match document for metrics
  batch.set(matchRef, {
    transport: memoryState.transport,
    sustainability: memoryState.sustainability,
    weather: memoryState.weather,
    powerStatus: memoryState.powerStatus,
    volunteerCapacity: memoryState.volunteerCapacity,
  });

  // Zones subcollection
  memoryState.zones.forEach(z => {
    batch.set(matchRef.collection('zones').doc(z.code), z);
  });
  
  // Incidents subcollection
  memoryState.incidents.forEach(i => {
    batch.set(matchRef.collection('incidents').doc(i.id), i);
  });

  // Timeline subcollection
  memoryState.timeline.forEach(t => {
    batch.set(matchRef.collection('timeline').doc(t.id), t);
  });

  // Merch subcollection
  memoryState.merchandise.forEach(m => {
    batch.set(matchRef.collection('merchandise').doc(m.id), m);
  });

  // Volunteers subcollection
  memoryState.volunteers.forEach(v => {
    batch.set(matchRef.collection('volunteers').doc(v.id), v);
  });
  
  // Recommendations subcollection
  memoryState.recommendations.forEach(r => {
    batch.set(matchRef.collection('recommendations').doc(r.id), r);
  });

  await batch.commit();
}

// --- CORE API ---

export async function getMatchState(matchId: string): Promise<MatchState> {
  if (USE_FIREBASE) {
    const cached = matchStates.get(matchId);
    const fetchedAt = stateFetchedAt.get(matchId) ?? 0;
    if (cached && Date.now() - fetchedAt < STATE_TTL) return cached;

    await ensureFirebaseSeeded(matchId);
    const matchRef = db.collection('matches').doc(matchId);
    
    const [matchDoc, zonesSnap, volsSnap, incsSnap, recsSnap, actsSnap, timeSnap, merchSnap, fansSnap] = await Promise.all([
      matchRef.get(),
      matchRef.collection('zones').get(),
      matchRef.collection('volunteers').get(),
      matchRef.collection('incidents').get(),
      matchRef.collection('recommendations').get(),
      matchRef.collection('actionHistory').get(),
      matchRef.collection('timeline').get(),
      matchRef.collection('merchandise').get(),
      matchRef.collection('activeFans').get(),
    ]);

    const mData = matchDoc.data() || {};
    // Active fans persist in Firestore; hydrate the map from the subcollection.
    const activeFans = new Map<string, ActiveGuest>(
      fansSnap.docs.map((d) => {
        const fan = d.data() as ActiveGuest;
        return [fan.ticketId, fan] as const;
      })
    );

    const newState: MatchState = {
      zones: zonesSnap.docs.map(d => d.data() as StadiumZone),
      volunteers: volsSnap.docs.map(d => d.data() as Volunteer),
      incidents: incsSnap.docs.map(d => d.data() as Incident),
      recommendations: recsSnap.docs.map(d => d.data() as Recommendation),
      actionHistory: actsSnap.docs.map(d => d.data() as ActionHistoryEntry),
      timeline: timeSnap.docs.map(d => d.data() as TimelineEvent),
      merchandise: merchSnap.docs.map(d => d.data() as MerchandiseItem),
      transport: mData.transport || TRANSPORT_DEFAULTS,
      sustainability: mData.sustainability || SUSTAINABILITY_DEFAULTS,
      weather: mData.weather || 'clear',
      weatherOverride: mData.weatherOverride === true,
      powerStatus: mData.powerStatus || 'stable',
      volunteerCapacity: mData.volunteerCapacity ?? 100,
      activeFans,
      liveMatchData: mData.liveMatchData as LiveMatchData | undefined,
      manualLive: mData.manualLive === true,
    };

    // --- SPORTMONKS LIVE FEED ---
    // Real live data only fills in when the organizer has NOT taken manual
    // control via the Live Match Controller, and only for the designated
    // showcase match (see LIVE_FEED_MATCH_ID).
    if (!newState.manualLive && matchId === LIVE_FEED_MATCH_ID) {
      try {
        const { fetchLiveMatch } = await import('./sportmonks');
        const live = await fetchLiveMatch();
        if (live) {
          newState.liveMatchData = { ...live, matchId };
        }
      } catch (err) {
        console.warn('Sportmonks fetch failed, keeping stored live data:', err);
      }
    }

    matchStates.set(matchId, newState);
    stateFetchedAt.set(matchId, Date.now());
    return newState;
  }

  const existingState = matchStates.get(matchId) ?? seedMatch(matchId);
  // Also for in-memory mode: live feed only when not manually controlled and
  // only for the designated showcase match (see LIVE_FEED_MATCH_ID).
  if (!existingState.manualLive && matchId === LIVE_FEED_MATCH_ID) {
    try {
      const { fetchLiveMatch } = await import('./sportmonks');
      const live = await fetchLiveMatch();
      if (live) {
        existingState.liveMatchData = { ...live, matchId };
      }
    } catch (err) {
      console.warn('Sportmonks fetch failed, keeping stored live data:', err);
    }
  }

  return existingState;
}

// Match/stadium metadata rarely changes — cache the Firestore copy for 5 min
// (the sensor loop calls getMatch on every tick).
const MATCH_META_TTL = 5 * 60 * 1000;
let matchListCache: { matches: MatchWithStadium[]; expires: number } | null = null;

export async function getMatches(): Promise<MatchWithStadium[]> {
  if (!USE_FIREBASE) {
    return MATCHES.map((m) => ({ ...m, stadium: STADIUMS.find((s) => s.id === m.stadiumId)! }));
  }
  if (matchListCache && matchListCache.expires > Date.now()) return matchListCache.matches;

  const [matchesSnap, stadiumsSnap] = await Promise.all([
    db.collection('matches_meta').get(),
    db.collection('stadiums').get(),
  ]);
  const stadiums = stadiumsSnap.docs.map(d => d.data());
  const matches = matchesSnap.docs.map(d => {
    const m = d.data() as any;
    const stadium = stadiums.find(s => s.id === m.stadiumId);
    return { ...m, stadium } as MatchWithStadium;
  });
  matchListCache = { matches, expires: Date.now() + MATCH_META_TTL };
  return matches;
}

export async function getMatch(matchId: string): Promise<MatchWithStadium | undefined> {
  if (!USE_FIREBASE) {
    const m = MATCHES.find((x) => x.id === matchId);
    if (!m) return undefined;
    return { ...m, stadium: STADIUMS.find((s) => s.id === m.stadiumId)! };
  }
  return (await getMatches()).find((m) => m.id === matchId);
}

export async function getMatchByCode(code: string): Promise<MatchWithStadium | undefined> {
  if (!USE_FIREBASE) {
    const m = MATCHES.find((x) => x.code === code);
    if (!m) return undefined;
    return { ...m, stadium: STADIUMS.find((s) => s.id === m.stadiumId)! };
  }
  return (await getMatches()).find((m) => m.code === code);
}

export async function getTicket(ticketId: string): Promise<Ticket | undefined> {
  if (!USE_FIREBASE) {
    return TICKETS.find((t) => t.ticketId.toUpperCase() === ticketId.toUpperCase());
  }
  const ticketDoc = await db.collection('tickets').doc(ticketId.toUpperCase()).get();
  if (!ticketDoc.exists) return undefined;
  return ticketDoc.data() as Ticket;
}

export async function getConfig(): Promise<{ ticketIds: string[] }> {
  // NOTE: demo credentials are intentionally NOT served over the API.
  // The login page reads them from the shared package for its quick-fill buttons.
  if (!USE_FIREBASE) {
    return { ticketIds: DEMO_TICKET_IDS };
  }
  const configDoc = await db.collection('config').doc('demo').get();
  if (!configDoc.exists) return { ticketIds: [] };
  const data = configDoc.data() as { ticketIds?: string[] };
  return { ticketIds: data.ticketIds ?? [] };
}

function computeMetricsFrom(s: MatchState): StadiumMetrics {
  const sectionZones = s.zones.filter((z) => z.zoneType === 'gate' || z.zoneType === 'section' || z.zoneType === 'food_court');
  const crowdDensity = sectionZones.length ? Math.round(sectionZones.reduce((sum, z) => sum + z.occupancy, 0) / sectionZones.length) : 0;
  return {
    crowdDensity,
    incidentsOpen: s.incidents.filter((i) => i.status === 'open' || i.status === 'assigned').length,
    volunteersActive: s.volunteers.filter((v) => v.status === 'available').length,
    volunteersTotal: s.volunteers.length,
    weather: s.weather,
    powerStatus: s.powerStatus,
  };
}

function computeHealthScoreFrom(s: MatchState, metrics: StadiumMetrics): number {
  let score = 100;
  score -= Math.max(0, metrics.crowdDensity - 70) * 0.6; // congestion penalty
  score -= metrics.incidentsOpen * 6;
  score -= Math.max(0, s.transport.parkingUtilization - 80) * 0.5;
  if (s.weather === 'rain') score -= 6;
  if (s.weather === 'storm') score -= 12;
  if (s.transport.metroStatus === 'delayed') score -= 5;
  if (s.transport.metroStatus === 'disrupted') score -= 10;
  if (s.powerStatus === 'degraded') score -= 8;
  if (s.powerStatus === 'outage') score -= 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function computeHealthScore(matchId: string): Promise<number> {
  const s = await getMatchState(matchId);
  return computeHealthScoreFrom(s, computeMetricsFrom(s));
}

export async function buildSnapshot(matchId: string): Promise<DashboardSnapshot> {
  const match = await getMatch(matchId);
  if (!match) throw new Error('Match not found');
  // Single state read per snapshot (Firebase mode does 8 collection reads per call).
  const s = await getMatchState(matchId);

  // Live weather at the stadium unless a simulation scenario has taken over.
  let weatherInfo: import('@stadiummind/shared').WeatherInfo | undefined;
  if (s.weatherOverride) {
    weatherInfo = { source: 'simulated', condition: s.weather, description: 'Scenario override active' };
  } else {
    try {
      const { fetchLiveWeather } = await import('./weather');
      const live = await fetchLiveWeather(match.stadium);
      if (live) {
        weatherInfo = live;
        s.weather = live.condition; // metrics/health reflect real conditions
      }
    } catch {
      /* keep stored weather */
    }
  }

  const metrics = computeMetricsFrom(s);
  const healthScore = computeHealthScoreFrom(s, metrics);
  const base = {
    match,
    healthScore,
    metrics,
    transport: s.transport,
    sustainability: s.sustainability,
    zones: s.zones,
    recommendations: s.recommendations,
    incidents: s.incidents,
    actionHistory: s.actionHistory,
    timeline: [...s.timeline].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 40),
    volunteers: s.volunteers,
    volunteerCapacity: s.volunteerCapacity,
    activeGuests: Array.from(s.activeFans.values()),
    liveMatchData: s.liveMatchData,
    weatherInfo,
  };
  // Snapshot summaries use the deterministic engine (snapshots are too frequent
  // for a Gemini round-trip) — badge it honestly.
  const aiSummary = fallbackAiSummary(base);
  return { ...base, aiSummary };
}

// Firestore doc IDs can't contain '/'; keys like "login:<uid>" or ticket IDs are safe.
const fanDocId = (ticketId: string) => encodeURIComponent(ticketId).replace(/\./g, '%2E');

export async function addActiveFan(matchId: string, fan: ActiveGuest): Promise<void> {
  const s = await getMatchState(matchId);
  s.activeFans.set(fan.ticketId, fan);
  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('activeFans').doc(fanDocId(fan.ticketId)).set(fan);
  }
}

export async function removeActiveFan(matchId: string, ticketId: string): Promise<void> {
  const s = await getMatchState(matchId);
  s.activeFans.delete(ticketId);
  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('activeFans').doc(fanDocId(ticketId)).delete();
  }
}

export async function setZoneOccupancy(matchId: string, code: string, occupancy: number): Promise<void> {
  await setZoneOccupancies(matchId, [{ code, occupancy }]);
}

// Batched variant — one Firestore batch write per call instead of N round trips.
//
// `persist` defaults to true (real operator actions must survive a restart).
// The sensor loop passes persist=false: its occupancy drift is ephemeral demo
// motion delivered to clients via the crowd:update socket emit, so writing it to
// Firestore every tick is pure waste — ~5,400 writes/hour would blow the
// free-tier 20k/day cap in under 4 hours. Memory-only keeps the cache + socket
// correct without touching quota.
export async function setZoneOccupancies(
  matchId: string,
  updates: { code: string; occupancy: number }[],
  persist = true
): Promise<void> {
  if (updates.length === 0) return;
  const s = await getMatchState(matchId);
  const clamped = updates.map((u) => ({
    code: u.code,
    occupancy: Math.max(0, Math.min(100, Math.round(u.occupancy))),
  }));

  // Keep the in-memory copy in sync in both modes.
  for (const u of clamped) {
    const z = s.zones.find((x) => x.code === u.code);
    if (z) {
      z.occupancy = u.occupancy;
      z.load = loadFromOccupancy(u.occupancy);
    }
  }

  if (USE_FIREBASE && persist) {
    const batch = db.batch();
    const zonesRef = db.collection('matches').doc(matchId).collection('zones');
    for (const u of clamped) {
      batch.update(zonesRef.doc(u.code), {
        occupancy: u.occupancy,
        load: loadFromOccupancy(u.occupancy),
      });
    }
    await batch.commit();
  }
}

export async function bumpZone(matchId: string, code: string, delta: number): Promise<number> {
  const s = await getMatchState(matchId);
  const z = s.zones.find((x) => x.code === code);
  if (!z) return 0;
  const target = Math.max(0, Math.min(100, Math.round(z.occupancy + delta)));
  await setZoneOccupancy(matchId, code, target);
  // keep the in-memory copy in sync so callers can read the fresh value
  z.occupancy = target;
  z.load = loadFromOccupancy(target);
  return target;
}

// Persist environment-level state (weather / power / transport / sustainability)
// in BOTH modes so mutations survive the next Firestore read.
export async function updateMatchEnv(
  matchId: string,
  updates: Partial<Pick<MatchState, 'weather' | 'weatherOverride' | 'powerStatus' | 'transport' | 'sustainability'>>
): Promise<void> {
  const s = await getMatchState(matchId);
  if (updates.weather !== undefined) s.weather = updates.weather;
  if (updates.weatherOverride !== undefined) s.weatherOverride = updates.weatherOverride;
  if (updates.powerStatus !== undefined) s.powerStatus = updates.powerStatus;
  if (updates.transport !== undefined) s.transport = { ...s.transport, ...updates.transport };
  if (updates.sustainability !== undefined) s.sustainability = { ...s.sustainability, ...updates.sustainability };

  if (USE_FIREBASE) {
    const payload: Record<string, unknown> = {};
    if (updates.weather !== undefined) payload.weather = s.weather;
    if (updates.weatherOverride !== undefined) payload.weatherOverride = s.weatherOverride;
    if (updates.powerStatus !== undefined) payload.powerStatus = s.powerStatus;
    if (updates.transport !== undefined) payload.transport = s.transport;
    if (updates.sustainability !== undefined) payload.sustainability = s.sustainability;
    await db.collection('matches').doc(matchId).set(payload, { merge: true });
  }
}

export async function updateIncident(matchId: string, incidentId: string, updates: Partial<Incident>): Promise<void> {
  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('incidents').doc(incidentId).update(updates);
  }
  const s = matchStates.get(matchId);
  const inc = s?.incidents.find((i) => i.id === incidentId);
  if (inc) Object.assign(inc, updates);
}

export async function addTimeline(matchId: string, ev: Omit<TimelineEvent, 'id' | 'matchId' | 'createdAt'>): Promise<TimelineEvent> {
  const full: TimelineEvent = { id: genId('t'), matchId, createdAt: new Date().toISOString(), ...ev };
  const s = await getMatchState(matchId);
  s.timeline.push(full);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('timeline').doc(full.id).set(full);
  }
  return full;
}

export async function addIncident(matchId: string, incident: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> {
  const full: Incident = { id: genId('inc'), createdAt: new Date().toISOString(), ...incident };
  const s = await getMatchState(matchId);
  s.incidents.unshift(full);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('incidents').doc(full.id).set(full);
  }
  return full;
}

export async function addRecommendation(matchId: string, rec: Omit<Recommendation, 'id' | 'matchId' | 'createdAt' | 'status'>): Promise<Recommendation> {
  const full: Recommendation = {
    id: genId('rec'),
    matchId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...rec,
  };
  const s = await getMatchState(matchId);
  s.recommendations.unshift(full);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('recommendations').doc(full.id).set(full);
  }
  return full;
}

export async function findRecommendation(recId: string): Promise<{ matchId: string; rec: Recommendation } | undefined> {
  // Cached states first (both modes) — avoids per-match Firestore doc reads.
  for (const [matchId, s] of matchStates) {
    const rec = s.recommendations.find((r) => r.id === recId);
    if (rec) return { matchId, rec };
  }

  if (USE_FIREBASE) {
    for (const m of MATCHES) {
      const doc = await db.collection('matches').doc(m.id).collection('recommendations').doc(recId).get();
      if (doc.exists) return { matchId: m.id, rec: doc.data() as Recommendation };
    }
    return undefined;
  }

  for (const m of MATCHES) await getMatchState(m.id);
  for (const [matchId, s] of matchStates) {
    const rec = s.recommendations.find((r) => r.id === recId);
    if (rec) return { matchId, rec };
  }
  return undefined;
}

export async function updateRecommendation(matchId: string, rec: Recommendation): Promise<void> {
  // Sync the cached copy (findRecommendation may return a detached object).
  const s = matchStates.get(matchId);
  const cachedRec = s?.recommendations.find((r) => r.id === rec.id);
  if (cachedRec && cachedRec !== rec) Object.assign(cachedRec, rec);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('recommendations').doc(rec.id).update({
      status: rec.status,
      decidedAt: rec.decidedAt ?? null,
    });
  }
}

export async function findIncident(incId: string): Promise<{ matchId: string; incident: Incident } | undefined> {
  // Cached states first (both modes) — avoids per-match Firestore doc reads.
  for (const [matchId, s] of matchStates) {
    const incident = s.incidents.find((i) => i.id === incId);
    if (incident) return { matchId, incident };
  }

  if (USE_FIREBASE) {
    for (const m of MATCHES) {
      const doc = await db.collection('matches').doc(m.id).collection('incidents').doc(incId).get();
      if (doc.exists) return { matchId: m.id, incident: doc.data() as Incident };
    }
    return undefined;
  }

  // Lazily seed any matches not yet loaded, then retry (mirrors findRecommendation).
  for (const m of MATCHES) await getMatchState(m.id);
  for (const [matchId, s] of matchStates) {
    const incident = s.incidents.find((i) => i.id === incId);
    if (incident) return { matchId, incident };
  }
  return undefined;
}

export async function addActionHistory(matchId: string, entry: Omit<ActionHistoryEntry, 'id' | 'matchId' | 'createdAt'>): Promise<ActionHistoryEntry> {
  const full: ActionHistoryEntry = { id: genId('act'), matchId, createdAt: new Date().toISOString(), ...entry };
  const s = await getMatchState(matchId);
  s.actionHistory.unshift(full);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('actionHistory').doc(full.id).set(full);
  }
  return full;
}

export async function getMerchandise(matchId: string): Promise<MerchandiseItem[]> {
  const state = await getMatchState(matchId);
  return state.merchandise;
}

export async function updateMerchandiseStock(matchId: string, id: string, newStock: number): Promise<MerchandiseItem | undefined> {
  const targetStock = Math.max(0, newStock);
  const s = await getMatchState(matchId);
  const item = s.merchandise.find(m => m.id === id);
  if (!item) return undefined;
  item.stock = targetStock;

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('merchandise').doc(id).update({ stock: targetStock });
  }
  return item;
}

export async function addMerchandiseItem(matchId: string, item: Omit<MerchandiseItem, 'id'>): Promise<MerchandiseItem> {
  const newItem: MerchandiseItem = {
    ...item,
    id: `merch-${Date.now()}`
  };
  const s = await getMatchState(matchId);
  s.merchandise.push(newItem);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('merchandise').doc(newItem.id).set(newItem);
  }
  return newItem;
}

export async function applyVolunteer(matchId: string, volunteer: Omit<Volunteer, 'id'>): Promise<Volunteer> {
  const newVol: Volunteer = {
    ...volunteer,
    id: `vol-${Date.now()}`
  };
  const s = await getMatchState(matchId);
  s.volunteers.push(newVol);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('volunteers').doc(newVol.id).set(newVol);
  }
  return newVol;
}

export async function updateVolunteer(matchId: string, volunteerId: string, updates: Partial<Volunteer>): Promise<Volunteer | undefined> {
  const s = await getMatchState(matchId);
  const v = s.volunteers.find(x => x.id === volunteerId);
  if (!v) return undefined;
  Object.assign(v, updates);

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).collection('volunteers').doc(volunteerId).set(v, { merge: true });
  }
  return v;
}

export async function setVolunteerCapacity(matchId: string, capacity: number): Promise<void> {
  const s = await getMatchState(matchId);
  s.volunteerCapacity = capacity;
  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).update({ volunteerCapacity: capacity });
  }
}

export async function updateLiveMatchData(matchId: string, partialData: Partial<LiveMatchData>): Promise<LiveMatchData> {
  const s = await getMatchState(matchId);
  if (!s.liveMatchData) {
    s.liveMatchData = {
      matchId,
      score: { home: 0, away: 0, minute: 0, period: 'Pre-Match' },
      players: [],
      events: []
    };
  }

  // Organizer took manual control: stop the live feed from overwriting it.
  s.manualLive = true;
  s.liveMatchData.source = 'manual';

  if (partialData.score) {
    s.liveMatchData.score = { ...s.liveMatchData.score, ...partialData.score };
  }
  if (partialData.players) {
    s.liveMatchData.players = partialData.players;
  }
  if (partialData.events) {
    s.liveMatchData.events = partialData.events;
  }

  if (USE_FIREBASE) {
    await db.collection('matches').doc(matchId).set(
      { liveMatchData: s.liveMatchData, manualLive: true },
      { merge: true }
    );
  }

  return s.liveMatchData;
}

// --- PROPOSALS ---
const memoryProposals: MatchProposal[] = [];

export async function getProposals(): Promise<MatchProposal[]> {
  if (USE_FIREBASE) {
    const snap = await db.collection('proposals').get();
    return snap.docs.map(d => d.data() as MatchProposal);
  }
  return memoryProposals;
}

export async function addProposal(proposal: MatchProposal): Promise<void> {
  if (USE_FIREBASE) {
    await db.collection('proposals').doc(proposal.id).set(proposal);
  } else {
    memoryProposals.push(proposal);
  }
}
