import type {
  Stadium,
  Match,
  StadiumZone,
  Ticket,
  Volunteer,
  Incident,
  Recommendation,
  SustainabilityMetrics,
  TransportMetrics,
  ZoneLoad,
  MerchandiseItem,
} from './types';

export const loadFromOccupancy = (occ: number): ZoneLoad =>
  occ >= 85 ? 'red' : occ >= 65 ? 'yellow' : 'green';

// ---- Stadiums (mirror supabase/seed.sql) ----
export const STADIUMS: Stadium[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'MetLife Stadium',
    hostCity: 'New York/New Jersey',
    country: 'United States',
    timezone: 'America/New_York',
    capacity: 82500,
    lat: 40.8135,
    lon: -74.0745,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'AT&T Stadium',
    hostCity: 'Dallas',
    country: 'United States',
    timezone: 'America/Chicago',
    capacity: 80000,
    lat: 32.7473,
    lon: -97.0945,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'SoFi Stadium',
    hostCity: 'Los Angeles',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    capacity: 70240,
    lat: 33.9535,
    lon: -118.3387,
  },
];

export const MATCHES: Match[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    code: 'NYJ-FRA-ESP-2026',
    homeTeam: 'France',
    awayTeam: 'Spain',
    stage: 'Group Stage',
    kickoffAt: '2026-06-14T23:00:00.000Z',
    stadiumId: '11111111-1111-1111-1111-111111111111',
    status: 'scheduled',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    code: 'DAL-ENG-ARG-2026',
    homeTeam: 'England',
    awayTeam: 'Argentina',
    stage: 'Group Stage',
    kickoffAt: '2026-06-15T23:00:00.000Z',
    stadiumId: '22222222-2222-2222-2222-222222222222',
    status: 'scheduled',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    code: 'LA-BRA-JPN-2026',
    homeTeam: 'Brazil',
    awayTeam: 'Japan',
    stage: 'Group Stage',
    kickoffAt: '2026-06-17T03:00:00.000Z',
    stadiumId: '33333333-3333-3333-3333-333333333333',
    status: 'scheduled',
  },
];

// Zone template applied to each stadium so every match has a usable digital twin.
interface ZoneTemplate {
  code: string;
  name: string;
  zoneType: StadiumZone['zoneType'];
  floor: number;
  x: number;
  y: number;
  capacity?: number;
  accessibilityScore: number;
  occupancy: number;
}

const ZONE_TEMPLATE: ZoneTemplate[] = [
  { code: 'GATE-4', name: 'Gate 4 (Main Entrance)', zoneType: 'gate', floor: 1, x: 15, y: 45, capacity: 9000, accessibilityScore: 85, occupancy: 78 },
  { code: 'GATE-5', name: 'Gate 5 (South Entrance)', zoneType: 'gate', floor: 1, x: 25, y: 22, capacity: 8500, accessibilityScore: 92, occupancy: 48 },
  { code: 'GATE-2', name: 'Gate 2 (VIP Entrance)', zoneType: 'gate', floor: 1, x: 22, y: 74, capacity: 8000, accessibilityScore: 80, occupancy: 55 },
  { code: 'GATE-1', name: 'Gate 1 (North Entrance)', zoneType: 'gate', floor: 1, x: 75, y: 80, capacity: 7000, accessibilityScore: 70, occupancy: 35 },
  { code: 'METRO-2', name: 'Metro Exit 2', zoneType: 'transport', floor: 1, x: 5, y: 50, capacity: 12000, accessibilityScore: 90, occupancy: 62 },
  { code: 'METRO-1', name: 'Metro Exit 1', zoneType: 'transport', floor: 1, x: 80, y: 20, capacity: 10000, accessibilityScore: 85, occupancy: 40 },
  { code: 'PARK-N', name: 'North Parking', zoneType: 'parking', floor: 1, x: 8, y: 15, capacity: 6000, accessibilityScore: 75, occupancy: 86 },
  { code: 'PARK-S', name: 'South Parking', zoneType: 'parking', floor: 1, x: 90, y: 85, capacity: 7000, accessibilityScore: 80, occupancy: 92 },
  { code: 'FOOD-C', name: 'Food Court C', zoneType: 'food_court', floor: 1, x: 42, y: 60, capacity: 1800, accessibilityScore: 80, occupancy: 58 },
  { code: 'FOOD-A', name: 'Food Court A', zoneType: 'food_court', floor: 1, x: 30, y: 80, capacity: 2000, accessibilityScore: 85, occupancy: 72 },
  { code: 'MERCH-1', name: 'Main Merch Store', zoneType: 'merchandise', floor: 1, x: 38, y: 30, capacity: 600, accessibilityScore: 82, occupancy: 40 },
  { code: 'MERCH-2', name: 'VIP Merch Kiosk', zoneType: 'merchandise', floor: 2, x: 60, y: 25, capacity: 200, accessibilityScore: 90, occupancy: 25 },
  { code: 'WASH-E', name: 'East Washrooms', zoneType: 'washroom', floor: 1, x: 55, y: 62, capacity: 1000, accessibilityScore: 88, occupancy: 44 },
  { code: 'WASH-W', name: 'West Washrooms', zoneType: 'washroom', floor: 1, x: 25, y: 62, capacity: 1000, accessibilityScore: 85, occupancy: 85 },
  { code: 'MED-1', name: 'Medical Point 1', zoneType: 'medical', floor: 1, x: 50, y: 50, capacity: 50, accessibilityScore: 95, occupancy: 20 },
  { code: 'MED-2', name: 'Medical Point 2', zoneType: 'medical', floor: 2, x: 20, y: 30, capacity: 40, accessibilityScore: 95, occupancy: 10 },
  { code: 'ACC-1', name: 'Accessibility Hub', zoneType: 'accessibility', floor: 1, x: 60, y: 38, capacity: 200, accessibilityScore: 98, occupancy: 30 },
  { code: 'SEC-B', name: 'Section B', zoneType: 'section', floor: 2, x: 72, y: 40, capacity: 12000, accessibilityScore: 78, occupancy: 52 },
  { code: 'SEC-C', name: 'Section C', zoneType: 'section', floor: 2, x: 82, y: 60, capacity: 11000, accessibilityScore: 76, occupancy: 50 },
  { code: 'SEC-A', name: 'Section A (VIP)', zoneType: 'section', floor: 2, x: 45, y: 20, capacity: 3000, accessibilityScore: 95, occupancy: 80 },
];

export function buildZonesForStadium(stadiumId: string): StadiumZone[] {
  return ZONE_TEMPLATE.map((t) => ({
    id: `${stadiumId.slice(0, 8)}-${t.code}`,
    stadiumId,
    code: t.code,
    name: t.name,
    zoneType: t.zoneType,
    floor: t.floor,
    x: t.x,
    y: t.y,
    capacity: t.capacity,
    accessibilityScore: t.accessibilityScore,
    occupancy: t.occupancy,
    load: loadFromOccupancy(t.occupancy),
  }));
}

export const TICKETS: Ticket[] = [
  {
    ticketId: 'WC2026-453621',
    matchId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    matchCode: 'NYJ-FRA-ESP-2026',
    seatLabel: 'B-203',
    sectionCode: 'SEC-B',
    recommendedGateCode: 'GATE-4',
    ticketHolderLabel: 'Demo Fan A',
    qrPayload: { ticket_id: 'WC2026-453621', match_code: 'NYJ-FRA-ESP-2026', seat: 'B-203', section: 'SEC-B', gate: 'GATE-4' },
  },
  {
    ticketId: 'WC2026-918204',
    matchId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    matchCode: 'NYJ-FRA-ESP-2026',
    seatLabel: 'B-118',
    sectionCode: 'SEC-B',
    recommendedGateCode: 'GATE-5',
    ticketHolderLabel: 'Demo Fan B',
    qrPayload: { ticket_id: 'WC2026-918204', match_code: 'NYJ-FRA-ESP-2026', seat: 'B-118', section: 'SEC-B', gate: 'GATE-5' },
  },
  {
    ticketId: 'WC2026-777111',
    matchId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    matchCode: 'DAL-ENG-ARG-2026',
    seatLabel: 'C-411',
    sectionCode: 'SEC-C',
    recommendedGateCode: 'GATE-2',
    ticketHolderLabel: 'Demo Fan C',
    qrPayload: { ticket_id: 'WC2026-777111', match_code: 'DAL-ENG-ARG-2026', seat: 'C-411', section: 'SEC-C', gate: 'GATE-2' },
  },
];

export function buildVolunteers(matchId: string): Volunteer[] {
  return [
    { id: `${matchId.slice(0, 4)}-v1`, matchId, displayName: 'Ava Johnson', email: 'ava@example.com', applicationStatus: 'approved', assignedZoneCode: 'GATE-4', status: 'available', skills: ['crowd_guidance', 'english', 'spanish'] },
    { id: `${matchId.slice(0, 4)}-v2`, matchId, displayName: 'Miguel Torres', email: 'miguel@example.com', applicationStatus: 'approved', assignedZoneCode: 'FOOD-C', status: 'available', skills: ['lost_found', 'spanish', 'portuguese'] },
    { id: `${matchId.slice(0, 4)}-v3`, matchId, displayName: 'Priya Shah', email: 'priya@example.com', applicationStatus: 'approved', assignedZoneCode: 'MED-1', status: 'busy', skills: ['accessibility', 'medical_escalation', 'hindi'] },
    { id: `${matchId.slice(0, 4)}-v4`, matchId, displayName: 'Liam O’Brien', email: 'liam@example.com', applicationStatus: 'approved', assignedZoneCode: 'GATE-5', status: 'available', skills: ['crowd_guidance', 'english'] },
    { id: `${matchId.slice(0, 4)}-v5`, matchId, displayName: 'Sofia Rossi', email: 'sofia@example.com', applicationStatus: 'approved', assignedZoneCode: 'MERCH-1', status: 'available', skills: ['retail', 'italian', 'english'] },
    { id: `${matchId.slice(0, 4)}-v6`, matchId, displayName: 'Ahmed Hassan', email: 'ahmed@example.com', applicationStatus: 'approved', assignedZoneCode: 'SEC-A', status: 'available', skills: ['vip_handling', 'arabic', 'english'] },
    { id: `${matchId.slice(0, 4)}-v7`, matchId, displayName: 'Chen Wei', email: 'chen@example.com', applicationStatus: 'approved', assignedZoneCode: 'METRO-1', status: 'busy', skills: ['transport_guidance', 'mandarin'] },
    { id: `${matchId.slice(0, 4)}-v8`, matchId, displayName: 'Emma Davies', email: 'emma@demo.com', applicationStatus: 'pending', status: 'available', skills: ['usher', 'english'] },
    { id: `${matchId.slice(0, 4)}-v9`, matchId, displayName: 'Demo Applicant', email: 'applicant@demo.com', applicationStatus: 'pending', status: 'available', skills: ['usher'] },
  ];
}

export function buildIncidents(matchId: string, nowIso: string): Incident[] {
  return [
    {
      id: `${matchId.slice(0, 4)}-i1`,
      matchId,
      type: 'accessibility',
      status: 'assigned',
      priority: 3,
      locationCode: 'ACC-1',
      description: 'Wheelchair user requesting escort to Section B.',
      assignedVolunteerId: `${matchId.slice(0, 4)}-v3`,
      createdAt: nowIso,
    },
    {
      id: `${matchId.slice(0, 4)}-i2`,
      matchId,
      type: 'crowd',
      status: 'open',
      priority: 5,
      locationCode: 'GATE-4',
      description: 'Severe crowding at Main Entrance, scanning turnstiles 1-3 malfunctioning.',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: `${matchId.slice(0, 4)}-i3`,
      matchId,
      type: 'medical',
      status: 'resolved',
      priority: 4,
      locationCode: 'SEC-C',
      description: 'Spectator reported feeling dizzy due to heat exhaustion.',
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ];
}

export function buildRecommendations(matchId: string, nowIso: string): Recommendation[] {
  return [
    {
      id: `${matchId.slice(0, 4)}-r1`,
      matchId,
      title: 'Open Gate 5 to relieve Gate 4',
      action: 'Open Gate 5 and redirect arriving fans from Gate 4 via signage and volunteers.',
      recommendationType: 'crowd',
      status: 'pending',
      confidence: 88,
      reason: 'Gate 4 occupancy is at 78% and rising while Gate 5 sits at 48%. Kickoff proximity increases arrival rate.',
      expectedOutcome: 'Reduce Gate 4 queue by ~30% and balance entry flow within 10 minutes.',
      impactedZones: ['GATE-4', 'GATE-5'],
      sourceSignals: { gate4: 78, gate5: 48 },
      createdAt: nowIso,
    },
    {
      id: `${matchId.slice(0, 4)}-r2`,
      matchId,
      title: 'Stage overflow parking',
      action: 'Activate overflow parking and push metro guidance to arriving fans.',
      recommendationType: 'transport',
      status: 'pending',
      confidence: 74,
      reason: 'North Parking is at 86% utilization with taxi demand high; overflow prevents gridlock.',
      expectedOutcome: 'Keep parking below capacity and cut approach-road congestion.',
      impactedZones: ['PARK-N', 'METRO-2'],
      sourceSignals: { parking: 86, taxiDemand: 'high' },
      createdAt: nowIso,
    },
  ];
}

export const TRANSPORT_DEFAULTS: TransportMetrics = {
  parkingUtilization: 86,
  metroStatus: 'normal',
  busDelayMinutes: 4,
  taxiDemand: 'high',
};

export const SUSTAINABILITY_DEFAULTS: SustainabilityMetrics = {
  electricityKwh: 6420,
  waterLiters: 38100,
  foodWasteKg: 72,
  plasticWasteKg: 28,
};

export const INITIAL_MERCH: MerchandiseItem[] = [
  { id: 'm1', name: 'Official Match Ball', price: 150, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1614632537197-38a4705f463c?auto=format&fit=crop&w=400&q=80', isExclusive: false },
  { id: 'm2', name: 'Home Team Jersey (Adult)', price: 120, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=80', isExclusive: false },
  { id: 'm3', name: 'Away Team Jersey (Adult)', price: 120, stock: 32, imageUrl: 'https://plus.unsplash.com/premium_photo-1678128330999-7925e59b2089?auto=format&fit=crop&w=400&q=80', isExclusive: false },
  { id: 'm4', name: 'Limited Edition Scarf', price: 45, stock: 0, imageUrl: 'https://images.unsplash.com/photo-1549247656-78eec86c4767?auto=format&fit=crop&w=400&q=80', isExclusive: true, exclusiveShops: ['VIP Lounge Level 2'] },
  { id: 'm5', name: 'Stadium Cap', price: 35, stock: 80, imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80', isExclusive: false },
  { id: 'm6', name: 'Commemorative Pin Set', price: 25, stock: 150, imageUrl: 'https://images.unsplash.com/photo-1618388810903-840bb6f183fd?auto=format&fit=crop&w=400&q=80', isExclusive: false },
  { id: 'm7', name: 'Matchday Program Booklet', price: 15, stock: 300, imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80', isExclusive: false },
  { id: 'm8', name: 'VIP Gold Scarf', price: 85, stock: 10, imageUrl: 'https://images.unsplash.com/photo-1520981825232-ece5fae45120?auto=format&fit=crop&w=400&q=80', isExclusive: true, exclusiveShops: ['VIP Lounge Level 2'] },
];

// ---- Player rosters per match ----
import type { Player } from './types';

function makePlayers(
  homeTeam: string,
  awayTeam: string,
  homeSquad: Omit<Player, 'team' | 'id'>[],
  awaySquad: Omit<Player, 'team' | 'id'>[]
): Player[] {
  return [
    ...homeSquad.map((p, i) => ({ ...p, id: `${homeTeam}-${i}`, team: 'home' as const })),
    ...awaySquad.map((p, i) => ({ ...p, id: `${awayTeam}-${i}`, team: 'away' as const })),
  ];
}

const FRANCE_SQUAD: Omit<Player, 'team' | 'id'>[] = [
  { name: 'Mike Maignan', jerseyNumber: 16, position: 'GK', isStarting: true },
  { name: 'Jules Koundé', jerseyNumber: 5, position: 'DEF', isStarting: true },
  { name: 'Dayot Upamecano', jerseyNumber: 4, position: 'DEF', isStarting: true },
  { name: 'William Saliba', jerseyNumber: 17, position: 'DEF', isStarting: true },
  { name: 'Theo Hernandez', jerseyNumber: 22, position: 'DEF', isStarting: true },
  { name: 'N\'Golo Kanté', jerseyNumber: 13, position: 'MID', isStarting: true },
  { name: 'Aurélien Tchouaméni', jerseyNumber: 8, position: 'MID', isStarting: true },
  { name: 'Antoine Griezmann', jerseyNumber: 7, position: 'MID', isStarting: true },
  { name: 'Ousmane Dembélé', jerseyNumber: 11, position: 'FWD', isStarting: true },
  { name: 'Kylian Mbappé', jerseyNumber: 10, position: 'FWD', isStarting: true },
  { name: 'Marcus Thuram', jerseyNumber: 9, position: 'FWD', isStarting: true },
  { name: 'Alphonse Areola', jerseyNumber: 23, position: 'GK', isStarting: false },
  { name: 'Benjamin Pavard', jerseyNumber: 2, position: 'DEF', isStarting: false },
  { name: 'Ibrahima Konaté', jerseyNumber: 3, position: 'DEF', isStarting: false },
  { name: 'Lucas Hernandez', jerseyNumber: 21, position: 'DEF', isStarting: false },
  { name: 'Youssouf Fofana', jerseyNumber: 6, position: 'MID', isStarting: false },
  { name: 'Adrien Rabiot', jerseyNumber: 14, position: 'MID', isStarting: false },
  { name: 'Kingsley Coman', jerseyNumber: 20, position: 'FWD', isStarting: false },
  { name: 'Randal Kolo Muani', jerseyNumber: 15, position: 'FWD', isStarting: false },
  { name: 'Bradley Barcola', jerseyNumber: 18, position: 'FWD', isStarting: false },
];

const SPAIN_SQUAD: Omit<Player, 'team' | 'id'>[] = [
  { name: 'Unai Simón', jerseyNumber: 1, position: 'GK', isStarting: true },
  { name: 'Dani Carvajal', jerseyNumber: 2, position: 'DEF', isStarting: true },
  { name: 'Robin Le Normand', jerseyNumber: 4, position: 'DEF', isStarting: true },
  { name: 'Aymeric Laporte', jerseyNumber: 14, position: 'DEF', isStarting: true },
  { name: 'Marc Cucurella', jerseyNumber: 24, position: 'DEF', isStarting: true },
  { name: 'Rodri', jerseyNumber: 16, position: 'MID', isStarting: true },
  { name: 'Fabian Ruiz', jerseyNumber: 8, position: 'MID', isStarting: true },
  { name: 'Pedri', jerseyNumber: 26, position: 'MID', isStarting: true },
  { name: 'Lamine Yamal', jerseyNumber: 19, position: 'FWD', isStarting: true },
  { name: 'Álvaro Morata', jerseyNumber: 7, position: 'FWD', isStarting: true },
  { name: 'Nico Williams', jerseyNumber: 11, position: 'FWD', isStarting: true },
  { name: 'David Raya', jerseyNumber: 25, position: 'GK', isStarting: false },
  { name: 'Nacho Fernández', jerseyNumber: 6, position: 'DEF', isStarting: false },
  { name: 'Jesús Navas', jerseyNumber: 22, position: 'DEF', isStarting: false },
  { name: 'Mikel Merino', jerseyNumber: 18, position: 'MID', isStarting: false },
  { name: 'Martín Zubimendi', jerseyNumber: 20, position: 'MID', isStarting: false },
  { name: 'Dani Olmo', jerseyNumber: 10, position: 'MID', isStarting: false },
  { name: 'Joselu', jerseyNumber: 9, position: 'FWD', isStarting: false },
  { name: 'Ferran Torres', jerseyNumber: 17, position: 'FWD', isStarting: false },
  { name: 'Ayoze Pérez', jerseyNumber: 15, position: 'FWD', isStarting: false },
];

const ENGLAND_SQUAD: Omit<Player, 'team' | 'id'>[] = [
  { name: 'Jordan Pickford', jerseyNumber: 1, position: 'GK', isStarting: true },
  { name: 'Reece James', jerseyNumber: 2, position: 'DEF', isStarting: true },
  { name: 'John Stones', jerseyNumber: 5, position: 'DEF', isStarting: true },
  { name: 'Marc Guéhi', jerseyNumber: 6, position: 'DEF', isStarting: true },
  { name: 'Luke Shaw', jerseyNumber: 3, position: 'DEF', isStarting: true },
  { name: 'Declan Rice', jerseyNumber: 4, position: 'MID', isStarting: true },
  { name: 'Kobbie Mainoo', jerseyNumber: 26, position: 'MID', isStarting: true },
  { name: 'Phil Foden', jerseyNumber: 10, position: 'MID', isStarting: true },
  { name: 'Bukayo Saka', jerseyNumber: 7, position: 'FWD', isStarting: true },
  { name: 'Harry Kane', jerseyNumber: 9, position: 'FWD', isStarting: true },
  { name: 'Jude Bellingham', jerseyNumber: 22, position: 'FWD', isStarting: true },
  { name: 'Dean Henderson', jerseyNumber: 13, position: 'GK', isStarting: false },
  { name: 'Kyle Walker', jerseyNumber: 21, position: 'DEF', isStarting: false },
  { name: 'Harry Maguire', jerseyNumber: 15, position: 'DEF', isStarting: false },
  { name: 'Conor Gallagher', jerseyNumber: 14, position: 'MID', isStarting: false },
  { name: 'Trent Alexander-Arnold', jerseyNumber: 8, position: 'MID', isStarting: false },
  { name: 'Cole Palmer', jerseyNumber: 20, position: 'FWD', isStarting: false },
  { name: 'Ollie Watkins', jerseyNumber: 11, position: 'FWD', isStarting: false },
  { name: 'Marcus Rashford', jerseyNumber: 19, position: 'FWD', isStarting: false },
  { name: 'Ivan Toney', jerseyNumber: 24, position: 'FWD', isStarting: false },
];

const ARGENTINA_SQUAD: Omit<Player, 'team' | 'id'>[] = [
  { name: 'Emiliano Martínez', jerseyNumber: 23, position: 'GK', isStarting: true },
  { name: 'Nahuel Molina', jerseyNumber: 26, position: 'DEF', isStarting: true },
  { name: 'Cristian Romero', jerseyNumber: 13, position: 'DEF', isStarting: true },
  { name: 'Lisandro Martínez', jerseyNumber: 25, position: 'DEF', isStarting: true },
  { name: 'Nicolás Tagliafico', jerseyNumber: 3, position: 'DEF', isStarting: true },
  { name: 'Rodrigo De Paul', jerseyNumber: 7, position: 'MID', isStarting: true },
  { name: 'Enzo Fernández', jerseyNumber: 24, position: 'MID', isStarting: true },
  { name: 'Alexis Mac Allister', jerseyNumber: 20, position: 'MID', isStarting: true },
  { name: 'Ángel Di María', jerseyNumber: 11, position: 'FWD', isStarting: true },
  { name: 'Lionel Messi', jerseyNumber: 10, position: 'FWD', isStarting: true },
  { name: 'Julián Álvarez', jerseyNumber: 9, position: 'FWD', isStarting: true },
  { name: 'Franco Armani', jerseyNumber: 1, position: 'GK', isStarting: false },
  { name: 'Gonzalo Montiel', jerseyNumber: 4, position: 'DEF', isStarting: false },
  { name: 'Germán Pezzella', jerseyNumber: 6, position: 'DEF', isStarting: false },
  { name: 'Leandro Paredes', jerseyNumber: 5, position: 'MID', isStarting: false },
  { name: 'Giovani Lo Celso', jerseyNumber: 16, position: 'MID', isStarting: false },
  { name: 'Nicolás González', jerseyNumber: 21, position: 'FWD', isStarting: false },
  { name: 'Lautaro Martínez', jerseyNumber: 22, position: 'FWD', isStarting: false },
  { name: 'Paulo Dybala', jerseyNumber: 21, position: 'FWD', isStarting: false },
  { name: 'Exequiel Palacios', jerseyNumber: 14, position: 'MID', isStarting: false },
];

const BRAZIL_SQUAD: Omit<Player, 'team' | 'id'>[] = [
  { name: 'Alisson Becker', jerseyNumber: 1, position: 'GK', isStarting: true },
  { name: 'Danilo', jerseyNumber: 2, position: 'DEF', isStarting: true },
  { name: 'Marquinhos', jerseyNumber: 4, position: 'DEF', isStarting: true },
  { name: 'Gabriel Magalhães', jerseyNumber: 5, position: 'DEF', isStarting: true },
  { name: 'Alex Telles', jerseyNumber: 6, position: 'DEF', isStarting: true },
  { name: 'Casemiro', jerseyNumber: 5, position: 'MID', isStarting: true },
  { name: 'Lucas Paquetá', jerseyNumber: 10, position: 'MID', isStarting: true },
  { name: 'Bruno Guimarães', jerseyNumber: 17, position: 'MID', isStarting: true },
  { name: 'Vinicius Jr.', jerseyNumber: 7, position: 'FWD', isStarting: true },
  { name: 'Rodrygo', jerseyNumber: 11, position: 'FWD', isStarting: true },
  { name: 'Endrick', jerseyNumber: 9, position: 'FWD', isStarting: true },
  { name: 'Ederson', jerseyNumber: 23, position: 'GK', isStarting: false },
  { name: 'Éder Militão', jerseyNumber: 3, position: 'DEF', isStarting: false },
  { name: 'Renan Lodi', jerseyNumber: 8, position: 'DEF', isStarting: false },
  { name: 'Fabinho', jerseyNumber: 13, position: 'MID', isStarting: false },
  { name: 'Gerson', jerseyNumber: 8, position: 'MID', isStarting: false },
  { name: 'Raphinha', jerseyNumber: 19, position: 'FWD', isStarting: false },
  { name: 'Gabriel Jesus', jerseyNumber: 9, position: 'FWD', isStarting: false },
  { name: 'Richarlison', jerseyNumber: 9, position: 'FWD', isStarting: false },
  { name: 'Gabriel Martinelli', jerseyNumber: 11, position: 'FWD', isStarting: false },
];

const JAPAN_SQUAD: Omit<Player, 'team' | 'id'>[] = [
  { name: 'Shuichi Gonda', jerseyNumber: 1, position: 'GK', isStarting: true },
  { name: 'Hiroki Sakai', jerseyNumber: 2, position: 'DEF', isStarting: true },
  { name: 'Takehiro Tomiyasu', jerseyNumber: 5, position: 'DEF', isStarting: true },
  { name: 'Ko Itakura', jerseyNumber: 4, position: 'DEF', isStarting: true },
  { name: 'Yuto Nagatomo', jerseyNumber: 5, position: 'DEF', isStarting: true },
  { name: 'Wataru Endo', jerseyNumber: 3, position: 'MID', isStarting: true },
  { name: 'Hidemasa Morita', jerseyNumber: 6, position: 'MID', isStarting: true },
  { name: 'Daichi Kamada', jerseyNumber: 8, position: 'MID', isStarting: true },
  { name: 'Kaoru Mitoma', jerseyNumber: 10, position: 'FWD', isStarting: true },
  { name: 'Ritsu Doan', jerseyNumber: 9, position: 'FWD', isStarting: true },
  { name: 'Ayase Ueda', jerseyNumber: 13, position: 'FWD', isStarting: true },
  { name: 'Daniel Schmidt', jerseyNumber: 12, position: 'GK', isStarting: false },
  { name: 'Shogo Taniguchi', jerseyNumber: 15, position: 'DEF', isStarting: false },
  { name: 'Miki Yamane', jerseyNumber: 22, position: 'DEF', isStarting: false },
  { name: 'Ao Tanaka', jerseyNumber: 17, position: 'MID', isStarting: false },
  { name: 'Gakuto Notsuda', jerseyNumber: 20, position: 'MID', isStarting: false },
  { name: 'Takuma Asano', jerseyNumber: 11, position: 'FWD', isStarting: false },
  { name: 'Junya Ito', jerseyNumber: 14, position: 'FWD', isStarting: false },
  { name: 'Koki Machida', jerseyNumber: 16, position: 'DEF', isStarting: false },
  { name: 'Yuki Soma', jerseyNumber: 19, position: 'FWD', isStarting: false },
];

export const MATCH_PLAYERS: Record<string, Player[]> = {
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': makePlayers('France', 'Spain', FRANCE_SQUAD, SPAIN_SQUAD),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': makePlayers('England', 'Argentina', ENGLAND_SQUAD, ARGENTINA_SQUAD),
  'cccccccc-cccc-cccc-cccc-cccccccccccc': makePlayers('Brazil', 'Japan', BRAZIL_SQUAD, JAPAN_SQUAD),
};

