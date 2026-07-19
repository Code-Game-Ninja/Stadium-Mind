// Deterministic simulation engine. Each scenario mutates match state, adds a
// timeline event, may raise an incident, and produces a fresh AI recommendation.

import {
  SIMULATION_SCENARIOS,
  type SimulationScenario,
  type Recommendation,
  type Incident,
  type TimelineEvent,
} from '@stadiummind/shared';
import {
  getMatchState,
  bumpZone,
  setZoneOccupancy,
  addTimeline,
  addIncident,
  addRecommendation,
  updateMatchEnv,
} from './store';

export interface ScenarioResult {
  scenario: SimulationScenario;
  timeline: TimelineEvent;
  recommendation?: Recommendation;
  incident?: Incident;
}

export async function applyScenario(matchId: string, scenario: SimulationScenario): Promise<ScenarioResult> {
  const meta = SIMULATION_SCENARIOS.find((s) => s.key === scenario)!;
  const state = await getMatchState(matchId);
  let recommendation: Recommendation | undefined;
  let incident: Incident | undefined;
  let detail = meta.description;

  switch (scenario) {
    case 'increase_crowd': {
      const g4Occ = await bumpZone(matchId, 'GATE-4', 14);
      await bumpZone(matchId, 'SEC-B', 8);
      await bumpZone(matchId, 'FOOD-C', 6);
      recommendation = await addRecommendation(matchId, {
        title: 'Open Gate 5 to relieve Gate 4',
        action: 'Open Gate 5 and redirect arriving fans from Gate 4 with signage and volunteers.',
        recommendationType: 'crowd',
        confidence: 90,
        reason: `Gate 4 surged to ${g4Occ}% while Gate 5 remains lower. Balancing entry avoids a crush point before kickoff.`,
        expectedOutcome: 'Cut Gate 4 queue ~30% and even out entry flow within 10 minutes.',
        impactedZones: ['GATE-4', 'GATE-5'],
        sourceSignals: { gate4: g4Occ },
      });
      detail = `Arrival surge pushed Gate 4 to ${g4Occ}%.`;
      break;
    }
    case 'rain_starts': {
      await updateMatchEnv(matchId, { weather: 'rain', weatherOverride: true });
      await bumpZone(matchId, 'GATE-4', 5);
      recommendation = await addRecommendation(matchId, {
        title: 'Activate covered queuing',
        action: 'Open covered queue lanes and message fans to arrive early; place wet-floor signage.',
        recommendationType: 'weather',
        confidence: 82,
        reason: 'Rain slows entry and raises slip risk on ramps and stairs.',
        expectedOutcome: 'Maintain entry throughput and reduce slip incidents.',
        impactedZones: ['GATE-4', 'GATE-5', 'METRO-2'],
        sourceSignals: { weather: 'rain' },
      });
      detail = 'Weather turned to rain across the venue.';
      break;
    }
    case 'metro_delay': {
      await updateMatchEnv(matchId, {
        transport: { ...state.transport, metroStatus: 'delayed', busDelayMinutes: state.transport.busDelayMinutes + 8 },
      });
      await bumpZone(matchId, 'METRO-2', 12);
      recommendation = await addRecommendation(matchId, {
        title: 'Stage staff at Metro Exit 2',
        action: 'Deploy volunteers to Metro Exit 2 and broadcast transport alert; keep overflow parking open.',
        recommendationType: 'transport',
        confidence: 78,
        reason: 'Metro delays create a late-arrival surge in the final 20 minutes before kickoff.',
        expectedOutcome: 'Smooth the late surge and prevent a bottleneck at Metro Exit 2.',
        impactedZones: ['METRO-2', 'GATE-4'],
        sourceSignals: { metroStatus: 'delayed' },
      });
      detail = 'Metro service delayed; late arrivals expected.';
      break;
    }
    case 'medical_emergency': {
      await setZoneOccupancy(matchId, 'MED-1', 60);
      incident = await addIncident(matchId, {
        matchId,
        type: 'medical',
        status: 'open',
        priority: 4,
        locationCode: 'SEC-B',
        description: 'Medical incident reported in Section B. Nearest medical team dispatched.',
      });
      recommendation = await addRecommendation(matchId, {
        title: 'Dispatch medics to Section B',
        action: 'Send Medical Point 1 team to Section B, clear an access lane, and hold nearby volunteers.',
        recommendationType: 'medical',
        confidence: 95,
        reason: 'A medical incident in Section B requires the nearest medical team and a clear access route. No diagnosis is provided.',
        expectedOutcome: 'Fast medical response with a clear escort path; escalate as needed.',
        impactedZones: ['SEC-B', 'MED-1'],
        sourceSignals: { incident: 'medical' },
      });
      detail = 'Medical emergency reported in Section B.';
      break;
    }
    case 'parking_full': {
      await updateMatchEnv(matchId, { transport: { ...state.transport, parkingUtilization: 99 } });
      await setZoneOccupancy(matchId, 'PARK-N', 99);
      recommendation = await addRecommendation(matchId, {
        title: 'Activate overflow parking + metro push',
        action: 'Open overflow parking, divert incoming cars, and push metro guidance to arriving fans.',
        recommendationType: 'transport',
        confidence: 85,
        reason: 'North Parking hit 99% — approach roads will gridlock without diversion.',
        expectedOutcome: 'Keep parking below hard capacity and cut approach-road congestion.',
        impactedZones: ['PARK-N', 'METRO-2'],
        sourceSignals: { parking: 99 },
      });
      detail = 'North Parking reached 99% utilization.';
      break;
    }
    case 'food_overload': {
      const fcOcc = await bumpZone(matchId, 'FOOD-C', 30);
      recommendation = await addRecommendation(matchId, {
        title: 'Add mobile concessions near Food Court C',
        action: 'Open a mobile concession line and redirect fans to secondary outlets.',
        recommendationType: 'concessions',
        confidence: 72,
        reason: `Food Court C queue at ${fcOcc}% exceeds comfort thresholds.`,
        expectedOutcome: 'Reduce food-court wait times and spread demand.',
        impactedZones: ['FOOD-C', 'MERCH-1'],
        sourceSignals: { foodCourt: fcOcc },
      });
      detail = `Food Court C overloaded at ${fcOcc}%.`;
      break;
    }
    case 'lost_child': {
      incident = await addIncident(matchId, {
        matchId,
        type: 'lost_child',
        status: 'open',
        priority: 4,
        locationCode: 'GATE-4',
        description: 'Unaccompanied minor reported near Gate 4. Parent held at help point; description broadcast.',
      });
      recommendation = await addRecommendation(matchId, {
        title: 'Initiate lost-child protocol',
        action: 'Broadcast a coded page, hold the parent at the help point, and coordinate security sweep near Gate 4.',
        recommendationType: 'safety',
        confidence: 91,
        reason: 'A lost-child report requires immediate coordinated search while keeping the guardian in place.',
        expectedOutcome: 'Fast reunification with minimal public alarm.',
        impactedZones: ['GATE-4', 'MED-1'],
        sourceSignals: { incident: 'lost_child' },
      });
      detail = 'Lost child reported near Gate 4.';
      break;
    }
    case 'power_issue': {
      await updateMatchEnv(matchId, { powerStatus: 'degraded' });
      recommendation = await addRecommendation(matchId, {
        title: 'Switch affected zone to backup power',
        action: 'Move the affected zone to backup power, dispatch facilities, and monitor for cascading load.',
        recommendationType: 'facilities',
        confidence: 80,
        reason: 'An electrical fault degraded power in a stadium zone. Escalate to facilities immediately.',
        expectedOutcome: 'Restore stable power and avoid a wider outage.',
        impactedZones: ['SEC-B', 'FOOD-C'],
        sourceSignals: { power: 'degraded' },
      });
      detail = 'Electrical fault degraded power in a stadium zone.';
      break;
    }
  }

  const timeline = await addTimeline(matchId, {
    kind: 'simulation',
    label: meta.label,
    detail,
    severity: meta.severity,
  });

  return { scenario, timeline, recommendation, incident };
}
