'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type DashboardSnapshot, type StadiumZone } from '@stadiummind/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

type CrowdUpdate = {
  matchId: string;
  zones: Pick<StadiumZone, 'code' | 'occupancy' | 'load'>[];
};

// Subscribes to a match room and returns the latest snapshot pushed by the server.
// Sensor-loop `crowd:update` ticks are merged into the current snapshot so zone
// occupancy breathes live between full snapshot pushes.
export function useMatchSnapshot(matchId: string | undefined) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit(SOCKET_EVENTS.joinMatch, matchId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on(SOCKET_EVENTS.stadiumSnapshot, (snap: DashboardSnapshot) => setSnapshot(snap));
    // Proactive AI briefing pushed by the server on a schedule — swap just the
    // summary panel in place so the organizer sees fresh updates without asking.
    socket.on(SOCKET_EVENTS.aiSummaryUpdated, (update: { matchId: string; aiSummary: DashboardSnapshot['aiSummary'] }) => {
      if (update.matchId !== matchId) return;
      setSnapshot((prev) => (prev ? { ...prev, aiSummary: update.aiSummary } : prev));
    });
    socket.on(SOCKET_EVENTS.crowdUpdate, (update: CrowdUpdate) => {
      if (update.matchId !== matchId) return;
      setSnapshot((prev) => {
        if (!prev) return prev;
        const byCode = new Map(update.zones.map((z) => [z.code, z]));
        const zones = prev.zones.map((z) => {
          const u = byCode.get(z.code);
          return u ? { ...z, occupancy: u.occupancy, load: u.load } : z;
        });
        const sectionZones = zones.filter((z) => z.zoneType === 'gate' || z.zoneType === 'section' || z.zoneType === 'food_court');
        const crowdDensity = sectionZones.length
          ? Math.round(sectionZones.reduce((sum, z) => sum + z.occupancy, 0) / sectionZones.length)
          : prev.metrics.crowdDensity;
        return { ...prev, zones, metrics: { ...prev.metrics, crowdDensity } };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  return { snapshot, setSnapshot, connected };
}
