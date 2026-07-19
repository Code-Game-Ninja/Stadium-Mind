import type {
  MatchWithStadium,
  StadiumZone,
  TicketVerifyResult,
  FanJourneyRequest,
  FanJourneyPlan,
  FanChatResponse,
  DashboardSnapshot,
  VolunteerSopRequest,
  VolunteerSopResponse,
  WhatIfRequest,
  WhatIfResponse,
  MatchBriefResponse,
  EndMatchReportResponse,
  TranslationResponse,
  Incident,
  Recommendation,
  ActionHistoryEntry,
  CreateIncidentRequest,
  MerchandiseItem,
  Volunteer,
  Player,
  SimulationScenario,
} from '@stadiummind/shared';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

// Attach the signed-in user's Firebase ID token so protected API routes
// (admin/volunteer surface) can verify role server-side.
async function authHeader(): Promise<Record<string, string>> {
  try {
    const { auth } = await import('./firebaseClient');
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(await authHeader()), ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.error || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getConfig: () => req<{ ticketIds: string[] }>('/config'),
  getMatches: () => req<{ matches: MatchWithStadium[] }>('/matches'),
  getMatch: (id: string) => req<{ match: MatchWithStadium; zones: StadiumZone[]; liveMatchData?: any; volunteerCapacity?: number }>(`/matches/${id}`),
  getMatchPlayers: (id: string) => req<{ players: Player[] }>(`/matches/${id}/players`),
  updateLiveMatch: (id: string, partial: { score?: Partial<import('@stadiummind/shared').LiveScore>; events?: unknown[] }) =>
    req<{ liveMatchData: any }>(`/matches/${id}/live`, { method: 'POST', body: JSON.stringify(partial) }),
  generateCommentary: (matchId: string, shorthand: string) =>
    req<{ event: any }>('/admin/commentary/generate', { method: 'POST', body: JSON.stringify({ matchId, shorthand }) }),
  verifyTicket: (body: { ticketId?: string; matchId: string; qrPayload?: unknown }) =>
    req<TicketVerifyResult>('/tickets/verify', { method: 'POST', body: JSON.stringify(body) }),
  fanJourney: (body: FanJourneyRequest) =>
    req<{ plan: FanJourneyPlan }>('/fan/journey', { method: 'POST', body: JSON.stringify(body) }),
  fanChat: (body: { matchId?: string; ticketId?: string; message: string }) =>
    req<FanChatResponse>('/fan/chat', { method: 'POST', body: JSON.stringify(body) }),
  fanLogout: (body: { matchId: string; ticketId: string }) =>
    req<{ success: boolean }>('/fan/logout', { method: 'POST', body: JSON.stringify(body) }),
  fanPresence: (body: { uid: string; name?: string; matchId?: string }) =>
    req<{ success: boolean; matchId: string }>('/fan/presence', { method: 'POST', body: JSON.stringify(body) }),
  fanHelp: (body: { matchId: string; ticketId: string; type: string; description: string }) =>
    req<{ success: boolean; incident: any }>('/fan/help', { method: 'POST', body: JSON.stringify(body) }),
  getDashboard: (matchId: string) =>
    req<{ snapshot: DashboardSnapshot }>(`/admin/dashboard/${matchId}`),
  applyRecommendation: (id: string) =>
    req<{ recommendation: Recommendation; action: ActionHistoryEntry; snapshot: DashboardSnapshot }>(
      `/admin/recommendations/${id}/apply`,
      { method: 'POST' }
    ),
  dismissRecommendation: (id: string) =>
    req<{ recommendation: Recommendation; action: ActionHistoryEntry; snapshot: DashboardSnapshot }>(
      `/admin/recommendations/${id}/dismiss`,
      { method: 'POST' }
    ),
  whatIf: (body: WhatIfRequest) =>
    req<WhatIfResponse>('/admin/what-if', { method: 'POST', body: JSON.stringify(body) }),
  matchBrief: (matchId: string) =>
    req<MatchBriefResponse>('/admin/reports/match-brief', { method: 'POST', body: JSON.stringify({ matchId }) }),
  endMatch: (matchId: string) =>
    req<EndMatchReportResponse>('/admin/reports/end-match', { method: 'POST', body: JSON.stringify({ matchId }) }),
  volunteerSop: (body: VolunteerSopRequest) =>
    req<VolunteerSopResponse>('/volunteer/sop', { method: 'POST', body: JSON.stringify(body) }),
  translate: (body: { targetLanguage: string; message: string }) =>
    req<TranslationResponse>('/volunteer/translate', { method: 'POST', body: JSON.stringify(body) }),
  voiceAssistant: (body: { message: string }) =>
    req<{ reply: string }>('/volunteer/voice-assistant', { method: 'POST', body: JSON.stringify(body) }),
  getIncidents: (matchId: string) => req<{ incidents: Incident[] }>(`/incidents?matchId=${matchId}`),
  createIncident: (body: CreateIncidentRequest) =>
    req<{ incident: Incident }>('/incidents', { method: 'POST', body: JSON.stringify(body) }),
  resolveIncident: (id: string) =>
    req<{ incident: Incident; snapshot: DashboardSnapshot }>(`/incidents/${id}/resolve`, { method: 'POST' }),
  assignIncident: (id: string, volunteerId: string) =>
    req<{ incident: Incident; volunteer: Volunteer; snapshot: DashboardSnapshot }>(`/incidents/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ volunteerId }),
    }),
  simulate: (matchId: string, scenario: SimulationScenario) =>
    req<{ snapshot: DashboardSnapshot }>('/simulation/scenario', {
      method: 'POST',
      body: JSON.stringify({ matchId, scenario }),
    }),
  getMerchandise: (matchId: string) => req<{ merchandise: MerchandiseItem[] }>(`/merchandise?matchId=${matchId}`),
  addMerchandiseItem: (matchId: string, item: Omit<MerchandiseItem, 'id'>) =>
    req<{ item: MerchandiseItem }>('/admin/merchandise', { method: 'POST', body: JSON.stringify({ matchId, item }) }),
  updateMerchandiseStock: (matchId: string, id: string, newStock: number) =>
    req<{ item: MerchandiseItem }>(`/admin/merchandise/${id}/stock`, { method: 'POST', body: JSON.stringify({ matchId, newStock }) }),
  updateVolunteer: (volunteerId: string, payload: { matchId: string; status?: string; applicationStatus?: string; assignedZoneCode?: string }) =>
    req<{ volunteer: Volunteer }>(`/admin/volunteers/${volunteerId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  setVolunteerCapacity: (matchId: string, capacity: number) =>
    req<{ success: boolean }>(`/admin/matches/${matchId}`, { method: 'PATCH', body: JSON.stringify({ volunteerCapacity: capacity }) }),
  getProposals: () => req<{ proposals: import('@stadiummind/shared').MatchProposal[] }>('/proposals'),
  createProposal: (proposal: import('@stadiummind/shared').MatchProposal) =>
    req<{ success: boolean; proposal: import('@stadiummind/shared').MatchProposal }>('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposal),
    }),
  applyVolunteer: (body: { matchId: string; name: string; email?: string; skills?: string[]; applicationRole?: string; note?: string }) =>
    req<{ volunteer: Volunteer }>('/volunteer/apply', { method: 'POST', body: JSON.stringify(body) }),
};
