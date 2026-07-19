// Proactive AI ops briefing: the "gives updates from time to time" layer.
//
// Unlike every other AI feature (which is reactive — fired by a button), this
// loop periodically generates a fresh live-ops briefing for whichever matches
// have a connected organizer and pushes it over Socket.IO as `ai:summary_updated`.
// The organizer's dashboard swaps its AI summary panel in place — no click needed.
//
// Only rooms with subscribers tick, and the interval is measured in minutes to
// stay well inside Gemini rate/cost limits.

import type { Server as SocketServer } from 'socket.io';
import { SOCKET_EVENTS } from '@stadiummind/shared';
import { getMatch, buildSnapshot } from './store';
import { generateOpsBriefing } from './ai';

// How often to generate a proactive briefing per active match.
const BRIEFING_MS = Number(process.env.AI_BRIEFING_INTERVAL_MS || 180_000); // 3 min

export function startOpsBriefingLoop(io: SocketServer): NodeJS.Timeout {
  const timer = setInterval(async () => {
    const rooms = io.sockets.adapter.rooms;
    for (const [room, sockets] of rooms) {
      if (sockets.size === 0) continue;
      // Skip socket-id "rooms" (every socket joins a room of its own id).
      if (io.sockets.sockets.has(room)) continue;

      try {
        const match = await getMatch(room);
        if (!match) continue;
        const snapshot = await buildSnapshot(room);
        const { aiSummary, ...base } = snapshot;
        const briefing = await generateOpsBriefing(base);
        io.to(room).emit(SOCKET_EVENTS.aiSummaryUpdated, { matchId: room, aiSummary: briefing });
      } catch (err) {
        console.warn(`[ops-briefing] tick failed for ${room}:`, (err as Error).message);
      }
    }
  }, BRIEFING_MS);

  timer.unref(); // don't hold the process open
  return timer;
}
