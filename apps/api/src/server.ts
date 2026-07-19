import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import {
  SOCKET_EVENTS,
  type TicketVerifyResult,
  type FanJourneyRequest,
  type FanChatRequest,
  type VolunteerSopRequest,
  type WhatIfRequest,
  type TranslationRequest,
  type CreateIncidentRequest,
  type SimulationScenario,
  MATCH_PLAYERS,
} from '@stadiummind/shared';
import {
  getMatches,
  getMatch,
  getTicket,
  getMatchState,
  buildSnapshot,
  getConfig,
  addIncident,
  addActionHistory,
  addTimeline,
  findRecommendation,
  findIncident,
  getMerchandise,
  addMerchandiseItem,
  updateMerchandiseStock,
  updateVolunteer,
  setVolunteerCapacity,
  updateRecommendation,
  addActiveFan,
  removeActiveFan,
  updateLiveMatchData,
  applyVolunteer,
  getProposals,
  addProposal,
  setZoneOccupancy,
  updateMatchEnv,
  updateIncident,
} from './store';
import { applyScenario } from './simulation';
import { requireAdmin, requireStaff } from './authMiddleware';
import { startSensorLoop } from './sensorLoop';
import { startOpsBriefingLoop } from './opsBriefingLoop';
import {
  geminiEnabled,
  generateFanJourney,
  generateFanChat,
  generateVolunteerSop,
  generateWhatIf,
  generateMatchBrief,
  generateEndMatch,
  generateTranslation,
  generateCommentary,
  generateVoiceAssistant,
} from './ai';

const PORT = Number(process.env.PORT || 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:3000';

const app = express();
app.use(cors({ origin: [WEB_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: [WEB_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'] },
});

io.on('connection', (socket) => {
  socket.on(SOCKET_EVENTS.joinMatch, async (matchId: string) => {
    if (typeof matchId !== 'string') return;
    socket.join(matchId);
    const match = await getMatch(matchId);
    if (match) socket.emit(SOCKET_EVENTS.stadiumSnapshot, await buildSnapshot(matchId));
  });
});

const emitSnapshot = async (matchId: string) => {
  io.to(matchId).emit(SOCKET_EVENTS.stadiumSnapshot, await buildSnapshot(matchId));
};

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

// ---- Route protection (enforced when Firebase is configured) ----
// Organizer-only surface: command center actions, simulation, proposals, live control.
app.use('/api/admin', requireAdmin);
app.use('/api/simulation', requireAdmin);
app.post('/api/proposals', requireAdmin);
app.post('/api/matches/:matchId/live', requireAdmin);
// Staff surface: incident workflow is volunteer + organizer.
app.post('/api/incidents/:id/resolve', requireStaff);

// ---- Health / meta ----
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    store: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'firestore' : 'in-memory',
    geminiEnabled,
    liveFeed: !!process.env.SPORTMONKS_API_KEY,
  });
});

app.get('/api/config', asyncHandler(async (_req, res) => {
  const config = await getConfig();
  res.json(config);
}));

// ---- Proposals ----
app.get('/api/proposals', asyncHandler(async (_req, res) => {
  res.json({ proposals: await getProposals() });
}));

app.post('/api/proposals', asyncHandler(async (req, res) => {
  const proposal = req.body;
  if (!proposal.id || !proposal.homeTeam || !proposal.awayTeam || !proposal.date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await addProposal(proposal);
  res.json({ success: true, proposal });
}));

// ---- Matches ----
app.get('/api/matches', asyncHandler(async (_req, res) => {
  res.json({ matches: await getMatches() });
}));

app.get('/api/matches/:matchId', asyncHandler(async (req, res) => {
  const match = await getMatch(req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const state = await getMatchState(match.id);
  res.json({ match, zones: state.zones, liveMatchData: state.liveMatchData, volunteerCapacity: state.volunteerCapacity });
}));

app.post('/api/matches/:matchId/live', asyncHandler(async (req, res) => {
  const matchId = req.params.matchId;
  const partialData = req.body;
  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  const updatedData = await updateLiveMatchData(matchId, partialData);
  await emitSnapshot(matchId);
  res.json({ liveMatchData: updatedData });
}));

app.get('/api/matches/:matchId/players', asyncHandler(async (req, res) => {
  const matchId = req.params.matchId;
  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const state = await getMatchState(match.id);
  const players = state.liveMatchData?.players && state.liveMatchData.players.length > 0 
    ? state.liveMatchData.players 
    : (MATCH_PLAYERS[matchId] || []);
  res.json({ players });
}));

// ---- Ticket verification ----
app.post('/api/tickets/verify', asyncHandler(async (req, res) => {
  const { ticketId, matchId, qrPayload } = req.body as {
    ticketId?: string;
    matchId?: string;
    qrPayload?: { ticket_id?: string; match_code?: string };
  };

  const resolvedTicketId = ticketId || qrPayload?.ticket_id;
  if (!resolvedTicketId || !matchId) {
    return res.status(400).json({ error: 'ticketId (or qrPayload) and matchId are required' });
  }

  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const ticket = await getTicket(resolvedTicketId);
  if (!ticket) {
    const result: TicketVerifyResult = {
      valid: false,
      reason: 'not_found',
      message: `Ticket ${resolvedTicketId} was not found in the demo ticket database.`,
    };
    return res.status(200).json(result);
  }

  if (ticket.matchId !== matchId) {
    const ticketMatch = await getMatch(ticket.matchId);
    const result: TicketVerifyResult = {
      valid: false,
      reason: 'match_mismatch',
      message: `Ticket ${ticket.ticketId} is valid, but for ${ticketMatch ? `${ticketMatch.homeTeam} vs ${ticketMatch.awayTeam}` : ticket.matchCode}, not the match you selected. Please select the correct match.`,
      ticket,
    };
    return res.status(200).json(result);
  }

  const result: TicketVerifyResult = {
    valid: true,
    reason: 'ok',
    message: `Ticket verified against the demo ticket database for ${match.homeTeam} vs ${match.awayTeam}. Seat ${ticket.seatLabel}, Section ${ticket.sectionCode}.`,
    ticket,
    match,
  };
  
  // Register the active fan guest profile
  await addActiveFan(matchId, {
    ticketId: ticket.ticketId,
    name: ticket.ticketHolderLabel || ticket.ticketId,
    matchId: matchId,
    activeAt: new Date().toISOString(),
    seatLabel: `Sec ${ticket.sectionCode}, Seat ${ticket.seatLabel}`,
  });
  await emitSnapshot(matchId);

  res.json(result);
}));

app.post('/api/fan/logout', asyncHandler(async (req, res) => {
  const { matchId, ticketId } = req.body;
  if (!matchId || !ticketId) {
    return res.status(400).json({ error: 'matchId and ticketId are required' });
  }
  await removeActiveFan(matchId, ticketId);
  await emitSnapshot(matchId);
  res.json({ success: true });
}));

// Register a logged-in fan as "active" so the organizer sees them in the
// Active Fans tab even before they verify a ticket. Keyed by uid (login:<uid>)
// so it never collides with real ticket IDs, and always lands on the match the
// organizer is watching (the showcase / live-feed match).
app.post('/api/fan/presence', asyncHandler(async (req, res) => {
  const { uid, name, matchId } = req.body as { uid?: string; name?: string; matchId?: string };
  if (!uid) return res.status(400).json({ error: 'uid is required' });

  const matches = await getMatches();
  const targetMatchId = matchId && matches.some((m) => m.id === matchId) ? matchId : matches[0]?.id;
  if (!targetMatchId) return res.status(404).json({ error: 'No match available' });

  await addActiveFan(targetMatchId, {
    ticketId: `login:${uid}`,
    name: name || 'Fan',
    matchId: targetMatchId,
    activeAt: new Date().toISOString(),
    seatLabel: 'Logged in (no ticket)',
  });
  await emitSnapshot(targetMatchId);
  res.json({ success: true, matchId: targetMatchId });
}));

app.post('/api/fan/help', asyncHandler(async (req, res) => {
  const { matchId, ticketId, type, description } = req.body;
  if (!matchId || !ticketId || !type) {
    return res.status(400).json({ error: 'matchId, ticketId, and type are required' });
  }
  const ticket = await getTicket(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  const incident = await addIncident(matchId, {
    matchId,
    type,
    locationCode: ticket.sectionCode,
    description: `Fan Request: ${description || 'Help needed at seat.'} (Seat: Sec ${ticket.sectionCode}, Seat ${ticket.seatLabel})`,
    priority: 2,
    status: 'open',
  });
  await addTimeline(matchId, {
    kind: 'incident',
    label: `Fan help request: ${type}`,
    detail: incident.description,
    severity: incident.priority,
  });
  io.to(matchId).emit(SOCKET_EVENTS.incidentNew, { incident });
  await emitSnapshot(matchId);
  res.json({ success: true, incident });
}));

// ---- Fan journey ----
app.post(
  '/api/fan/journey',
  asyncHandler(async (req, res) => {
    const body = req.body as FanJourneyRequest;
    const match = await getMatch(body.matchId);
    const ticket = await getTicket(body.ticketId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (!ticket || ticket.matchId !== body.matchId) {
      return res.status(400).json({ error: 'Ticket is not valid for this match. Verify first.' });
    }
    const state = await getMatchState(match.id);
    const zones = state.zones;
    const plan = await generateFanJourney(body, ticket, match, zones);
    res.json({ plan });
  })
);

// ---- Fan chat ----
app.post(
  '/api/fan/chat',
  asyncHandler(async (req, res) => {
    const body = req.body as FanChatRequest;
    if (!body.message) return res.status(400).json({ error: 'message is required' });
    const match = body.matchId ? await getMatch(body.matchId) : undefined;
    const ticket = body.ticketId ? await getTicket(body.ticketId) : undefined;
    const state = match ? await getMatchState(match.id) : undefined;
    const zones = state ? state.zones : [];
    const merchandise = match ? await getMerchandise(match.id) : [];
    const response = await generateFanChat(body.message, ticket, match, zones, merchandise);
    res.json(response);
  })
);

// ---- Admin dashboard ----
app.get('/api/admin/dashboard/:matchId', asyncHandler(async (req, res) => {
  const match = await getMatch(req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const snapshot = await buildSnapshot(match.id);
  res.json({ snapshot });
}));

app.patch('/api/admin/volunteers/:volunteerId', asyncHandler(async (req, res) => {
  const { matchId, ...updates } = req.body;
  if (!matchId) return res.status(400).json({ error: 'matchId is required' });
  const updated = await updateVolunteer(matchId, req.params.volunteerId, updates);
  if (!updated) return res.status(404).json({ error: 'Volunteer not found' });
  await emitSnapshot(matchId);
  res.json({ volunteer: updated });
}));

app.patch('/api/admin/matches/:matchId', asyncHandler(async (req, res) => {
  const { volunteerCapacity } = req.body;
  if (volunteerCapacity !== undefined) {
    await setVolunteerCapacity(req.params.matchId, volunteerCapacity);
    await emitSnapshot(req.params.matchId);
  }
  res.json({ success: true });
}));

// ---- Recommendation apply / dismiss ----
app.post('/api/admin/recommendations/:id/apply', asyncHandler(async (req, res) => {
  const found = await findRecommendation(req.params.id);
  if (!found) return res.status(404).json({ error: 'Recommendation not found' });
  const { matchId, rec } = found;
  if (rec.status !== 'pending') return res.status(409).json({ error: `Recommendation already ${rec.status}` });

  rec.status = 'applied';
  rec.decidedAt = new Date().toISOString();
  await updateRecommendation(matchId, rec);

  // Apply real effects to the digital twin (persisted in both store modes).
  const state = await getMatchState(matchId);
  for (const code of rec.impactedZones) {
    const zone = state.zones.find((z) => z.code === code);
    if (zone && (zone.zoneType === 'gate' || zone.zoneType === 'food_court' || zone.zoneType === 'section')) {
      await setZoneOccupancy(matchId, code, zone.occupancy - 18);
    }
  }
  if (rec.recommendationType === 'transport') {
    await updateMatchEnv(matchId, {
      transport: {
        ...state.transport,
        parkingUtilization: Math.max(0, state.transport.parkingUtilization - 12),
        metroStatus: state.transport.metroStatus === 'delayed' ? 'normal' : state.transport.metroStatus,
      },
    });
  }
  if (rec.recommendationType === 'weather') {
    // Scenario handled — hand weather back to the live Open-Meteo feed.
    await updateMatchEnv(matchId, { weather: 'clear', weatherOverride: false });
  }
  if (rec.recommendationType === 'facilities') {
    await updateMatchEnv(matchId, { powerStatus: 'stable' });
  }

  const action = await addActionHistory(matchId, {
    recommendationId: rec.id,
    actionLabel: rec.title,
    status: 'applied',
    outcomeSummary: rec.expectedOutcome,
  });
  await addTimeline(matchId, { kind: 'action', label: `Applied: ${rec.title}`, detail: rec.expectedOutcome, severity: 2 });

  io.to(matchId).emit(SOCKET_EVENTS.actionUpdated, { recommendation: rec, action });
  await emitSnapshot(matchId);
  res.json({ recommendation: rec, action, snapshot: await buildSnapshot(matchId) });
}));

app.post('/api/admin/recommendations/:id/dismiss', asyncHandler(async (req, res) => {
  const found = await findRecommendation(req.params.id);
  if (!found) return res.status(404).json({ error: 'Recommendation not found' });
  const { matchId, rec } = found;
  if (rec.status !== 'pending') return res.status(409).json({ error: `Recommendation already ${rec.status}` });

  rec.status = 'dismissed';
  rec.decidedAt = new Date().toISOString();
  await updateRecommendation(matchId, rec);
  const action = await addActionHistory(matchId, {
    recommendationId: rec.id,
    actionLabel: rec.title,
    status: 'dismissed',
    outcomeSummary: 'Dismissed by organizer.',
  });
  await addTimeline(matchId, { kind: 'action', label: `Dismissed: ${rec.title}`, severity: 1 });

  io.to(matchId).emit(SOCKET_EVENTS.actionUpdated, { recommendation: rec, action });
  await emitSnapshot(matchId);
  res.json({ recommendation: rec, action, snapshot: await buildSnapshot(matchId) });
}));

// ---- What-if ----
app.post(
  '/api/admin/what-if',
  asyncHandler(async (req, res) => {
    const body = req.body as WhatIfRequest;
    const match = await getMatch(body.matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (!body.question) return res.status(400).json({ error: 'question is required' });
    const snapshot = await buildSnapshot(match.id);
    const result = await generateWhatIf(body, snapshot);
    res.json(result);
  })
);

// ---- Reports ----
app.post(
  '/api/admin/reports/match-brief',
  asyncHandler(async (req, res) => {
    const { matchId } = req.body as { matchId?: string };
    const match = matchId ? await getMatch(matchId) : undefined;
    if (!match) return res.status(404).json({ error: 'Match not found' });
    const snapshot = await buildSnapshot(match.id);
    const report = await generateMatchBrief(snapshot);
    res.json(report);
  })
);

app.post(
  '/api/admin/reports/end-match',
  asyncHandler(async (req, res) => {
    const { matchId } = req.body as { matchId?: string };
    const match = matchId ? await getMatch(matchId) : undefined;
    if (!match) return res.status(404).json({ error: 'Match not found' });
    const snapshot = await buildSnapshot(match.id);
    const report = await generateEndMatch(snapshot);
    res.json(report);
  })
);

// ---- Volunteer SOP ----
app.post(
  '/api/volunteer/sop',
  asyncHandler(async (req, res) => {
    const body = req.body as VolunteerSopRequest;
    if (!body.scenario) return res.status(400).json({ error: 'scenario is required' });
    const response = await generateVolunteerSop(body);
    res.json(response);
  })
);

// ---- Volunteer Application ----
app.post(
  '/api/volunteer/apply',
  asyncHandler(async (req, res) => {
    const { matchId, applicationStatus, applicationRole, location, name, email, skills, note } = req.body;

    if (!matchId) return res.status(400).json({ error: 'matchId is required' });
    const match = await getMatch(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const newVol = await applyVolunteer(matchId, {
      matchId,
      displayName: name || 'Fan Volunteer',
      email,
      applicationStatus: applicationStatus === 'approved' ? 'approved' : 'pending',
      assignedZoneCode: location || undefined,
      status: 'available',
      skills: Array.isArray(skills) && skills.length ? skills : [applicationRole || 'Fan Supporter'],
      note: typeof note === 'string' && note.trim() ? note.slice(0, 2000) : undefined,
    });

    await emitSnapshot(matchId);
    res.json({ volunteer: newVol });
  })
);

// ---- Volunteer translation ----
app.post(
  '/api/volunteer/translate',
  asyncHandler(async (req, res) => {
    const body = req.body as TranslationRequest;
    if (!body.message || !body.targetLanguage) {
      return res.status(400).json({ error: 'message and targetLanguage are required' });
    }
    const response = await generateTranslation(body);
    res.json(response);
  })
);

// ---- Voice Assistant ----
app.post(
  '/api/volunteer/voice-assistant',
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const response = await generateVoiceAssistant(message);
    res.json(response);
  })
);

// ---- Commentary Generation ----
app.post(
  '/api/admin/commentary/generate',
  asyncHandler(async (req, res) => {
    const { matchId, shorthand } = req.body;
    if (!matchId || !shorthand) return res.status(400).json({ error: 'matchId and shorthand required' });
    const match = await getMatch(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    
    const state = await getMatchState(matchId);
    const score = state.liveMatchData?.score || { home: 0, away: 0, minute: 0, period: '1H' };
    
    const response = await generateCommentary(shorthand, match, score);
    res.json(response);
  })
);

// ---- Incidents ----
app.get('/api/incidents', asyncHandler(async (req, res) => {
  const matchId = req.query.matchId as string | undefined;
  if (!matchId) return res.status(400).json({ error: 'matchId query param is required' });
  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const state = await getMatchState(matchId);
  res.json({ incidents: state.incidents });
}));

app.post('/api/incidents', asyncHandler(async (req, res) => {
  const body = req.body as CreateIncidentRequest;
  const match = await getMatch(body.matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (!body.type || !body.locationCode || !body.description) {
    return res.status(400).json({ error: 'type, locationCode and description are required' });
  }
  const incident = await addIncident(body.matchId, {
    matchId: body.matchId,
    type: body.type,
    status: 'open',
    priority: Math.max(1, Math.min(5, body.priority || 3)),
    locationCode: body.locationCode,
    description: body.description,
  });
  await addTimeline(body.matchId, { kind: 'incident', label: `Incident: ${body.type}`, detail: body.description, severity: incident.priority });
  io.to(body.matchId).emit(SOCKET_EVENTS.incidentNew, { incident });
  await emitSnapshot(body.matchId);
  res.status(201).json({ incident });
}));

app.post('/api/incidents/:id/resolve', asyncHandler(async (req, res) => {
  const found = await findIncident(req.params.id);
  if (!found) return res.status(404).json({ error: 'Incident not found' });
  const { matchId, incident } = found;
  if (incident.status === 'resolved') {
    return res.status(400).json({ error: 'Incident already resolved' });
  }

  incident.status = 'resolved';
  incident.resolvedAt = new Date().toISOString();
  await updateIncident(matchId, incident.id, { status: 'resolved', resolvedAt: incident.resolvedAt });

  // Release the assigned volunteer back to the pool.
  if (incident.assignedVolunteerId) {
    await updateVolunteer(matchId, incident.assignedVolunteerId, { status: 'available' });
  }

  await addTimeline(matchId, {
    kind: 'incident',
    label: `Resolved: ${incident.type.replace('_', ' ')}`,
    detail: `Incident in ${incident.locationCode} marked resolved.`,
    severity: 1,
  });

  await emitSnapshot(matchId);
  res.json({ incident, snapshot: await buildSnapshot(matchId) });
}));

// Assign an incident to a volunteer (organizer command center).
app.post('/api/incidents/:id/assign', requireAdmin, asyncHandler(async (req, res) => {
  const { volunteerId } = req.body as { volunteerId?: string };
  if (!volunteerId) return res.status(400).json({ error: 'volunteerId is required' });

  const found = await findIncident(req.params.id);
  if (!found) return res.status(404).json({ error: 'Incident not found' });
  const { matchId, incident } = found;
  if (incident.status === 'resolved' || incident.status === 'dismissed') {
    return res.status(409).json({ error: `Incident already ${incident.status}` });
  }

  const state = await getMatchState(matchId);
  const volunteer = state.volunteers.find((v) => v.id === volunteerId);
  if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

  incident.status = 'assigned';
  incident.assignedVolunteerId = volunteerId;
  await updateIncident(matchId, incident.id, { status: 'assigned', assignedVolunteerId: volunteerId });
  await updateVolunteer(matchId, volunteerId, { status: 'busy', assignedZoneCode: incident.locationCode });

  await addTimeline(matchId, {
    kind: 'incident',
    label: `Assigned: ${incident.type.replace('_', ' ')}`,
    detail: `${volunteer.displayName} dispatched to ${incident.locationCode}.`,
    severity: incident.priority,
  });

  await emitSnapshot(matchId);
  res.json({ incident, volunteer, snapshot: await buildSnapshot(matchId) });
}));

// ---- Simulation ----
app.post('/api/simulation/scenario', asyncHandler(async (req, res) => {
  const { matchId, scenario } = req.body as { matchId?: string; scenario?: SimulationScenario };
  const match = matchId ? await getMatch(matchId) : undefined;
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const validScenarios: SimulationScenario[] = [
    'increase_crowd', 'rain_starts', 'metro_delay', 'medical_emergency',
    'parking_full', 'food_overload', 'lost_child', 'power_issue',
  ];
  if (!scenario || !validScenarios.includes(scenario)) {
    return res.status(400).json({ error: 'Invalid scenario' });
  }

  const result = await applyScenario(match.id, scenario);

  io.to(match.id).emit(SOCKET_EVENTS.simulationApplied, result);
  if (result.incident) io.to(match.id).emit(SOCKET_EVENTS.incidentNew, { incident: result.incident });
  if (result.recommendation) io.to(match.id).emit(SOCKET_EVENTS.recommendationNew, { recommendation: result.recommendation });
  await emitSnapshot(match.id);

  res.json({ ...result, snapshot: await buildSnapshot(match.id) });
}));

// ---- Merchandise ----
app.get('/api/merchandise', asyncHandler(async (req, res) => {
  const matchId = req.query.matchId as string | undefined;
  if (!matchId) return res.status(400).json({ error: 'matchId query param is required' });
  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json({ merchandise: await getMerchandise(matchId) });
}));

app.post('/api/admin/merchandise', asyncHandler(async (req, res) => {
  const { matchId, item } = req.body as { matchId?: string; item?: any };
  if (!matchId || !item) return res.status(400).json({ error: 'matchId and item are required' });
  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const newItem = await addMerchandiseItem(matchId, item);
  res.status(201).json({ item: newItem });
}));

app.post('/api/admin/merchandise/:id/stock', asyncHandler(async (req, res) => {
  const { matchId, newStock } = req.body as { matchId?: string; newStock?: number };
  if (!matchId || newStock === undefined) return res.status(400).json({ error: 'matchId and newStock are required' });
  const match = await getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  // Need to check previous stock to see if it was restocked from 0
  const merchandise = await getMerchandise(matchId);
  const oldMerch = merchandise.find(m => m.id === req.params.id);
  const wasSoldOut = oldMerch ? oldMerch.stock === 0 : false;
  
  const updatedItem = await updateMerchandiseStock(matchId, req.params.id, newStock);
  if (!updatedItem) return res.status(404).json({ error: 'Merchandise item not found' });
  
  if (wasSoldOut && newStock > 0) {
    // Broadcast restock notification
    io.to(matchId).emit(SOCKET_EVENTS.merchandiseRestock, { item: updatedItem });
  }
  
  res.json({ item: updatedItem });
}));

// ---- Error handler ----
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api] error:', err.message);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

server.listen(PORT, () => {
  console.log(`\n  StadiumMind AI API running on http://localhost:${PORT}`);
  console.log(`  Gemini: ${geminiEnabled ? 'enabled' : 'fallback (no key)'}  |  Store: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Firestore' : 'in-memory demo'}\n`);
  startSensorLoop(io);
  startOpsBriefingLoop(io);
});
