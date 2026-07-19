// Sensor heartbeat: the simulated IoT-telemetry layer of the digital twin.
//
// Real stadium turnstile/density feeds are private infrastructure, so this
// module stands in as the ingestion point: every TICK it drifts zone occupancy
// along a plausible match-day arrival curve and pushes `crowd:update` over
// Socket.IO. Swapping this for a real sensor feed means replacing one module.
//
// Only matches with connected clients tick — no idle Firestore writes.

import type { Server as SocketServer } from 'socket.io';
import { SOCKET_EVENTS, loadFromOccupancy, type StadiumZone } from '@stadiummind/shared';
import { getMatch, getMatchState } from './store';

const TICK_MS = 8000;

// Zone-type behaviour: how strongly each zone drifts toward the arrival curve.
const DRIFT_WEIGHT: Record<string, number> = {
  gate: 1.0,
  transport: 0.9,
  section: 0.7,
  food_court: 0.6,
  merchandise: 0.5,
  washroom: 0.4,
  parking: 0.8,
  medical: 0.1,
  accessibility: 0.3,
};

// Deterministic-ish jitter so zones don't move in lockstep.
function jitter(range: number): number {
  return (Math.random() - 0.5) * 2 * range;
}

// Arrival curve: where the crowd "wants" to be relative to kickoff.
// Ramps up through the 2h before kickoff, peaks near kickoff, eases in-match.
function arrivalTarget(kickoffAt: string): number {
  const minsToKickoff = (new Date(kickoffAt).getTime() - Date.now()) / 60000;
  if (minsToKickoff > 120) return 25;
  if (minsToKickoff > 0) return 25 + Math.round(((120 - minsToKickoff) / 120) * 55); // 25 → 80
  if (minsToKickoff > -105) return 65; // during the match: concourses settle
  return 45; // post-match egress tail
}

// The sensor drift is ephemeral demo motion: it's delivered to clients purely
// via the crowd:update socket emit and lives in the store's in-memory state
// cache. It is deliberately NOT written to Firestore — the values are random
// walk noise that a restart reseeds anyway, so persisting them would only burn
// the free-tier write quota (leaving it off preserves the full 20k/day budget
// for real operator actions: incidents, recommendations, volunteers).

export function startSensorLoop(io: SocketServer): NodeJS.Timeout {
  const timer = setInterval(async () => {
    // Tick only rooms that look like match IDs and have subscribers.
    const rooms = io.sockets.adapter.rooms;
    for (const [room, sockets] of rooms) {
      if (sockets.size === 0) continue;
      // Skip socket-id "rooms" (every socket joins a room of its own id).
      if (io.sockets.sockets.has(room)) continue;

      try {
        const match = await getMatch(room);
        if (!match) continue;
        const state = await getMatchState(room);
        const target = arrivalTarget(match.kickoffAt);

        const updates: Pick<StadiumZone, 'code' | 'occupancy' | 'load'>[] = [];
        for (const zone of state.zones) {
          const weight = DRIFT_WEIGHT[zone.zoneType] ?? 0.5;
          // Ease 6% of the gap toward the curve per tick, plus organic noise.
          const drift = (target - zone.occupancy) * 0.06 * weight + jitter(2.5);
          if (Math.abs(drift) < 0.5) continue;
          const next = Math.max(0, Math.min(100, Math.round(zone.occupancy + drift)));
          if (next === zone.occupancy) continue;
          // Mutate the cached state directly — REST/socket snapshots read this.
          zone.occupancy = next;
          zone.load = loadFromOccupancy(next);
          updates.push({ code: zone.code, occupancy: next, load: zone.load });
        }

        if (updates.length > 0) {
          io.to(room).emit(SOCKET_EVENTS.crowdUpdate, { matchId: room, zones: updates });
        }
      } catch (err) {
        console.warn(`[sensor-loop] tick failed for ${room}:`, err);
      }
    }
  }, TICK_MS);

  timer.unref(); // don't hold the process open
  return timer;
}
