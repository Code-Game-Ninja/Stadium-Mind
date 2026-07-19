import type { SimulationScenario } from './types';

export const SOCKET_EVENTS = {
  stadiumSnapshot: 'stadium:snapshot',
  crowdUpdate: 'crowd:update',
  incidentNew: 'incident:new',
  recommendationNew: 'recommendation:new',
  actionUpdated: 'action:updated',
  simulationApplied: 'simulation:scenario_applied',
  aiSummaryUpdated: 'ai:summary_updated',
  joinMatch: 'match:join',
  merchandiseRestock: 'merchandise:restock',
} as const;

export const SIMULATION_SCENARIOS: {
  key: SimulationScenario;
  label: string;
  description: string;
  severity: number;
}[] = [
  { key: 'increase_crowd', label: 'Increase Crowd', description: 'Surge of arrivals at entry gates', severity: 3 },
  { key: 'rain_starts', label: 'Rain Starts', description: 'Weather turns, covered queues needed', severity: 2 },
  { key: 'metro_delay', label: 'Metro Delay', description: 'Transit disruption at Metro Exit 2', severity: 3 },
  { key: 'medical_emergency', label: 'Medical Emergency', description: 'Medical incident in the stands', severity: 4 },
  { key: 'parking_full', label: 'Parking Full', description: 'Parking utilization spikes to capacity', severity: 3 },
  { key: 'food_overload', label: 'Food Court Overloaded', description: 'Concession queues exceed comfort', severity: 2 },
  { key: 'lost_child', label: 'Lost Child', description: 'Unaccompanied minor reported', severity: 4 },
  { key: 'power_issue', label: 'Power Issue', description: 'Electrical fault in a stadium zone', severity: 5 },
];

export const ACCESSIBILITY_LABELS: Record<string, string> = {
  none: 'No accessibility needs',
  wheelchair: 'Wheelchair user',
  senior: 'Senior citizen',
  child: 'Traveling with a child',
  low_walking: 'Prefers low walking',
};

export const ARRIVAL_LABELS: Record<string, string> = {
  metro: 'Metro',
  car: 'Car',
  bus: 'Bus',
  taxi: 'Taxi',
  walking: 'Walking',
};

// Demo admin/volunteer credentials surfaced in the UI when Supabase is not configured.
export const DEMO_CREDENTIALS = {
  admin: { email: 'organizer@stadiummind.ai', password: 'demo1234' },
  volunteer: { email: 'volunteer@stadiummind.ai', password: 'demo1234' },
  fan: { email: 'fan@stadiummind.ai', password: 'demo1234' },
};

export const DEMO_TICKET_IDS = ['WC2026-453621', 'WC2026-918204', 'WC2026-777111'];
