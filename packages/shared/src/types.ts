// Core domain types for StadiumMind AI.
// Mirrors supabase/schema.sql but simplified for the hackathon MVP.

export type AppRole = 'admin' | 'volunteer' | 'fan';

export type ZoneType =
  | 'gate'
  | 'section'
  | 'food_court'
  | 'washroom'
  | 'medical'
  | 'parking'
  | 'transport'
  | 'merchandise'
  | 'accessibility';

export type IncidentType =
  | 'medical'
  | 'security'
  | 'maintenance'
  | 'lost_child'
  | 'lost_item'
  | 'crowd'
  | 'accessibility'
  | 'transport';

export type IncidentStatus = 'open' | 'assigned' | 'resolved' | 'dismissed';
export type ActionStatus = 'pending' | 'applied' | 'dismissed' | 'expired';
export type ZoneLoad = 'green' | 'yellow' | 'red';

export type ArrivalMethod = 'metro' | 'car' | 'bus' | 'taxi' | 'walking';
export type AccessibilityNeed = 'none' | 'wheelchair' | 'senior' | 'child' | 'low_walking';

export type SimulationScenario =
  | 'increase_crowd'
  | 'rain_starts'
  | 'metro_delay'
  | 'medical_emergency'
  | 'parking_full'
  | 'food_overload'
  | 'lost_child'
  | 'power_issue';

export interface Stadium {
  id: string;
  name: string;
  hostCity: string;
  country: string;
  timezone: string;
  capacity: number;
  /** Coordinates for live weather lookups. */
  lat?: number;
  lon?: number;
}

export interface Match {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  kickoffAt: string; // ISO
  stadiumId: string;
  status: 'scheduled' | 'live' | 'completed';
}

export interface MatchWithStadium extends Match {
  stadium: Stadium;
}

export interface MatchProposal {
  id: string;
  date: string; // ISO format
  homeTeam: string;
  awayTeam: string;
  requiredVolunteers: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  team: 'home' | 'away';
  isStarting: boolean;
  photoUrl?: string;
  stats?: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'commentary';
  team?: 'home' | 'away';
  player1Id?: string; // e.g., scorer or player out
  player2Id?: string; // e.g., assist or player in
  text: string; // The commentary text
  isAiGenerated?: boolean;
  createdAt: string;
}

export interface LiveScore {
  home: number;
  away: number;
  minute: number;
  period: '1H' | 'HT' | '2H' | 'FT' | 'Pre-Match';
}

export interface LiveMatchData {
  matchId: string;
  score: LiveScore;
  players: Player[];
  events: MatchEvent[];
  /** Data provenance: real feed vs organizer manual entry vs demo seed. */
  source?: 'sportmonks' | 'manual' | 'seed';
  /** Real team names from the live feed (may differ from the demo fixture). */
  teams?: { home: string; away: string };
}

export interface StadiumZone {
  id: string;
  stadiumId: string;
  code: string;
  name: string;
  zoneType: ZoneType;
  floor: number;
  x: number; // 0-100 map coordinate
  y: number; // 0-100 map coordinate
  capacity?: number;
  accessibilityScore: number;
  // live state
  occupancy: number; // 0-100 %
  load: ZoneLoad;
}

export interface Ticket {
  ticketId: string;
  matchId: string;
  matchCode: string;
  seatLabel: string;
  sectionCode: string;
  recommendedGateCode: string;
  ticketHolderLabel?: string;
  qrPayload: { ticket_id: string; match_code: string; [k: string]: unknown };
}

export interface TicketVerifyResult {
  valid: boolean;
  reason: 'ok' | 'not_found' | 'match_mismatch';
  message: string;
  ticket?: Ticket;
  match?: MatchWithStadium;
}

export interface Volunteer {
  id: string;
  matchId: string;
  displayName: string;
  email?: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  assignedZoneCode?: string;
  status: 'available' | 'busy' | 'break';
  skills: string[];
  /** Application note / motivation essay from the volunteer-apply form. */
  note?: string;
}

export interface Incident {
  id: string;
  matchId: string;
  type: IncidentType;
  status: IncidentStatus;
  priority: number; // 1-5
  locationCode: string;
  description: string;
  createdBy?: string;
  assignedVolunteerId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Recommendation {
  id: string;
  matchId: string;
  title: string;
  action: string;
  recommendationType: string;
  status: ActionStatus;
  confidence: number; // 0-100
  reason: string;
  expectedOutcome: string;
  impactedZones: string[];
  sourceSignals: Record<string, unknown>;
  createdAt: string;
  decidedAt?: string;
}

export interface ActionHistoryEntry {
  id: string;
  recommendationId?: string;
  matchId: string;
  actionLabel: string;
  status: ActionStatus;
  outcomeSummary?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  matchId: string;
  kind: 'incident' | 'simulation' | 'recommendation' | 'action' | 'ai';
  label: string;
  detail?: string;
  severity: number; // 1-5
  createdAt: string;
}

export interface TransportMetrics {
  parkingUtilization: number; // 0-100
  metroStatus: 'normal' | 'delayed' | 'disrupted';
  busDelayMinutes: number;
  taxiDemand: 'low' | 'medium' | 'high';
}

export interface SustainabilityMetrics {
  electricityKwh: number;
  waterLiters: number;
  foodWasteKg: number;
  plasticWasteKg: number;
}

export interface StadiumMetrics {
  crowdDensity: number; // 0-100 avg occupancy
  incidentsOpen: number;
  volunteersActive: number;
  volunteersTotal: number;
  weather: 'clear' | 'rain' | 'storm';
  powerStatus: 'stable' | 'degraded' | 'outage';
}

export interface WeatherInfo {
  /** 'live' = Open-Meteo at the stadium coordinates, 'simulated' = scenario override. */
  source: 'live' | 'simulated';
  condition: StadiumMetrics['weather'];
  tempC?: number;
  windKmh?: number;
  description?: string;
}

export interface DashboardSnapshot {
  match: MatchWithStadium;
  healthScore: number; // 0-100
  metrics: StadiumMetrics;
  transport: TransportMetrics;
  sustainability: SustainabilityMetrics;
  zones: StadiumZone[];
  recommendations: Recommendation[];
  incidents: Incident[];
  actionHistory: ActionHistoryEntry[];
  timeline: TimelineEvent[];
  aiSummary: AiSummary;
  volunteers: Volunteer[];
  volunteerCapacity: number;
  liveMatchData?: LiveMatchData;
  activeGuests: ActiveGuest[];
  weatherInfo?: WeatherInfo;
}

export interface ActiveGuest {
  ticketId: string;
  name: string;
  matchId: string;
  activeAt: string;
  seatLabel: string;
}

export interface AiSummary {
  summary: string;
  risks: string[];
  fallbackUsed: boolean;
}

// ---- AI request/response contracts ----

export interface FanJourneyRequest {
  matchId: string;
  ticketId: string;
  arrivalMethod: ArrivalMethod;
  preferences: {
    wantsFood?: boolean;
    wantsWashroom?: boolean;
    wantsMerchandise?: boolean;
    wantsWater?: boolean;
    wantsPhotoZone?: boolean;
    accessibilityNeed?: AccessibilityNeed;
  };
}

export interface FanJourneyStep {
  order: number;
  label: string;
  location: string;
  durationMinutes: number;
  note?: string;
}

export interface FanJourneyPlan {
  summary: string;
  entryGate: string;
  alternateGate?: string;
  steps: FanJourneyStep[];
  arrivalEstimate: string;
  warnings: string[];
  accessibilityNotes: string[];
  fallbackUsed: boolean;
}

export interface FanChatRequest {
  matchId: string;
  ticketId?: string;
  message: string;
}

export interface FanChatResponse {
  reply: string;
  fallbackUsed: boolean;
}

export interface VolunteerSopRequest {
  matchId: string;
  scenario:
    | 'lost_child'
    | 'lost_item'
    | 'medical'
    | 'crowd'
    | 'accessibility'
    | 'maintenance';
  zoneCode?: string;
  details?: string;
}

export interface VolunteerSopResponse {
  title: string;
  steps: string[];
  escalateTo: string;
  incidentDraft: {
    type: IncidentType;
    priority: number;
    locationCode: string;
    description: string;
  };
  fallbackUsed: boolean;
}

export interface WhatIfRequest {
  matchId: string;
  question: string;
}

export interface WhatIfResponse {
  impact: string[];
  mitigations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  projectedZones?: { code: string; occupancy: number }[];
  fallbackUsed: boolean;
}

export interface MatchBriefResponse {
  brief: string;
  keyRisks: string[];
  recommendedSetup: string[];
  fallbackUsed: boolean;
}

export interface EndMatchReportResponse {
  report: string;
  wins: string[];
  improvements: string[];
  fallbackUsed: boolean;
}

export interface TranslationRequest {
  targetLanguage: string;
  message: string;
}

export interface TranslationResponse {
  translatedText: string;
  notes: string;
  fallbackUsed: boolean;
}

export interface CreateIncidentRequest {
  matchId: string;
  type: IncidentType;
  priority: number;
  locationCode: string;
  description: string;
}

export interface MerchandiseItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  isExclusive?: boolean;
  exclusiveShops?: string[];
}
