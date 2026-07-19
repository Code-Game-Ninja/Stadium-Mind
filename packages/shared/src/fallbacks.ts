// Deterministic AI fallbacks. Used when GEMINI_API_KEY is missing or a Gemini
// call fails. Every generator returns the same shape as the Gemini path so the
// app never breaks. All copy avoids claiming real FIFA validation.

import { ACCESSIBILITY_LABELS, ARRIVAL_LABELS } from './constants';
import type {
  FanJourneyPlan,
  FanJourneyRequest,
  FanChatResponse,
  VolunteerSopRequest,
  VolunteerSopResponse,
  WhatIfResponse,
  MatchBriefResponse,
  EndMatchReportResponse,
  TranslationRequest,
  TranslationResponse,
  AiSummary,
  Ticket,
  MatchWithStadium,
  StadiumZone,
  DashboardSnapshot,
} from './types';

function minutesToKickoff(kickoffAt: string): number {
  const diff = new Date(kickoffAt).getTime() - Date.now();
  return Math.round(diff / 60000);
}

function lessCrowdedGate(zones: StadiumZone[], preferredGate: string): StadiumZone | undefined {
  const gates = zones.filter((z) => z.zoneType === 'gate');
  const preferred = gates.find((g) => g.code === preferredGate);
  const best = [...gates].sort((a, b) => a.occupancy - b.occupancy)[0];
  if (!preferred || !best) return best;
  // Only suggest an alternate if it is meaningfully less crowded.
  return best.code !== preferred.code && preferred.occupancy - best.occupancy >= 15 ? best : undefined;
}

export function fallbackFanJourney(
  req: FanJourneyRequest,
  ticket: Ticket,
  match: MatchWithStadium,
  zones: StadiumZone[]
): FanJourneyPlan {
  const prefs = req.preferences || {};
  const access = prefs.accessibilityNeed || 'none';
  const preferredGate = ticket.recommendedGateCode;
  const gateZone = zones.find((z) => z.code === preferredGate);
  const alternate = lessCrowdedGate(zones, preferredGate);
  const entryGate = alternate ? alternate.code : preferredGate;
  const mins = minutesToKickoff(match.kickoffAt);

  const steps: FanJourneyPlan['steps'] = [];
  let order = 1;
  const arrivalLabel = ARRIVAL_LABELS[req.arrivalMethod] || 'Arrival';

  steps.push({
    order: order++,
    label: `Arrive by ${arrivalLabel}`,
    location: req.arrivalMethod === 'metro' ? 'Metro Exit 2' : req.arrivalMethod === 'car' ? 'North Parking' : 'Drop-off zone',
    durationMinutes: 6,
    note: req.arrivalMethod === 'car' ? 'North Parking is busy — allow extra time or consider metro.' : undefined,
  });
  steps.push({
    order: order++,
    label: `Enter at ${zones.find((z) => z.code === entryGate)?.name || entryGate}`,
    location: entryGate,
    durationMinutes: access === 'wheelchair' || access === 'low_walking' ? 10 : 8,
    note: alternate ? `Rerouted from ${preferredGate} (busier) to ${entryGate} to save queue time.` : undefined,
  });
  if (access === 'wheelchair' || access === 'senior' || access === 'low_walking') {
    steps.push({ order: order++, label: 'Use Accessibility Hub for step-free routing', location: 'ACC-1', durationMinutes: 4 });
  }
  if (prefs.wantsWater || prefs.wantsFood) {
    steps.push({ order: order++, label: prefs.wantsFood ? 'Grab food before kickoff' : 'Refill water', location: 'FOOD-C', durationMinutes: 12, note: 'Food Court C is moderate now; queues grow near kickoff.' });
  }
  if (prefs.wantsMerchandise) {
    steps.push({ order: order++, label: 'Visit merchandise store', location: 'MERCH-1', durationMinutes: 8 });
  }
  if (prefs.wantsWashroom) {
    steps.push({ order: order++, label: 'Washroom stop', location: 'WASH-E', durationMinutes: 5 });
  }
  if (prefs.wantsPhotoZone) {
    steps.push({ order: order++, label: 'Photo zone by the pitch view', location: 'SEC-B', durationMinutes: 5 });
  }
  steps.push({
    order: order++,
    label: `Head to seat ${ticket.seatLabel}`,
    location: ticket.sectionCode,
    durationMinutes: access === 'wheelchair' || access === 'low_walking' ? 9 : 6,
  });

  const totalMinutes = steps.reduce((s, st) => s + st.durationMinutes, 0);
  const warnings: string[] = [];
  if (gateZone && gateZone.occupancy >= 75) warnings.push(`${gateZone.name} is currently busy (${gateZone.occupancy}%).`);
  if (mins > 0 && totalMinutes > mins) warnings.push(`Your plan needs ~${totalMinutes} min but kickoff is in ${mins} min — move quickly or skip optional stops.`);
  warnings.push('This ticket was verified against the demo ticket database, not a live FIFA system.');

  const accessibilityNotes: string[] = [];
  if (access !== 'none') {
    accessibilityNotes.push(`${ACCESSIBILITY_LABELS[access]}: step-free routes and staffed help points are prioritized.`);
    accessibilityNotes.push('Volunteers at the Accessibility Hub (ACC-1) can provide an escort to your seat.');
  }

  return {
    summary: `Personalized plan for ${match.homeTeam} vs ${match.awayTeam} at ${match.stadium.name}. Enter via ${entryGate}, then route to seat ${ticket.seatLabel} in Section ${ticket.sectionCode}.`,
    entryGate,
    alternateGate: alternate ? preferredGate : undefined,
    steps,
    arrivalEstimate: mins > 0 ? `Arrive at least ${Math.max(totalMinutes + 15, 45)} min before kickoff (${mins} min away).` : 'Kickoff time reached — proceed directly to your seat.',
    warnings,
    accessibilityNotes,
    fallbackUsed: true,
  };
}

export function fallbackFanChat(
  message: string,
  ticket: Ticket | undefined,
  match: MatchWithStadium | undefined,
  zones: StadiumZone[]
): FanChatResponse {
  const q = message.toLowerCase();
  const gate = ticket ? ticket.recommendedGateCode : undefined;
  const alt = [...zones.filter((z) => z.zoneType === 'gate')].sort((a, b) => a.occupancy - b.occupancy)[0];
  let reply: string;

  if (q.includes('gate') && (q.includes('less') || q.includes('crowd') || q.includes('quiet'))) {
    reply = alt ? `${alt.name} (${alt.code}) is the least crowded gate right now at ${alt.occupancy}% occupancy. Head there to save time.` : 'Gate occupancy data is unavailable right now.';
  } else if (q.includes('gate') || q.includes('entry') || q.includes('enter')) {
    reply = gate ? `Your recommended entry is ${gate}. If it is busy, ${alt ? alt.name : 'a quieter gate'} is a good alternate.` : 'Enter via your recommended gate. Verify a ticket to get a personalized gate.';
  } else if (q.includes('food') || q.includes('eat') || q.includes('drink')) {
    reply = 'Food Court C is your closest concession. Queues grow near kickoff, so go early — allow about 12 minutes.';
  } else if (q.includes('washroom') || q.includes('toilet') || q.includes('restroom') || q.includes('bathroom')) {
    reply = 'The nearest washrooms are the East Washrooms (WASH-E), a short walk from the concourse.';
  } else if (q.includes('stairs') || q.includes('wheelchair') || q.includes('accessib') || q.includes('step')) {
    reply = 'For a step-free route, go through the Accessibility Hub (ACC-1). Volunteers there can escort you to your seat.';
  } else if (q.includes('seat') || q.includes('section')) {
    reply = ticket ? `Your seat is ${ticket.seatLabel} in Section ${ticket.sectionCode}. Follow concourse signs after entering your gate.` : 'Verify your ticket and I can guide you to your exact seat and section.';
  } else if (q.includes('kickoff') || q.includes('time') || q.includes('start')) {
    reply = match ? `Kickoff for ${match.homeTeam} vs ${match.awayTeam} is at ${new Date(match.kickoffAt).toLocaleString()}. Arrive at least 45 minutes early.` : 'Select a match to see kickoff time.';
  } else {
    reply = ticket
      ? `I can help with your gate, seat, food, washrooms, and step-free routes for ${match?.homeTeam} vs ${match?.awayTeam}. What do you need? (Ticket verified against the demo ticket database.)`
      : 'I can help with gates, food, washrooms and routes. Verify your demo ticket for personalized answers.';
  }
  return { reply, fallbackUsed: true };
}

const SOP_LIBRARY: Record<VolunteerSopRequest['scenario'], Omit<VolunteerSopResponse, 'fallbackUsed'>> = {
  lost_child: {
    title: 'Lost Child SOP',
    steps: [
      'Stay calm and keep the reporting parent/guardian at your help point — do not send them searching.',
      'Collect the child’s name, age, clothing description, and last-seen location.',
      'Radio security and the nearest gate lead immediately; broadcast the description.',
      'Escort the parent to the nearest Help Point / Medical Point 1 and keep them there.',
      'Do not announce the child’s full name publicly; use a coded page per stadium policy.',
      'Log the incident and update status when the child is reunited.',
    ],
    escalateTo: 'Security Control + Gate Lead',
    incidentDraft: { type: 'lost_child', priority: 4, locationCode: 'GATE-4', description: 'Unaccompanied minor reported. Parent held at help point; description broadcast to security.' },
  },
  lost_item: {
    title: 'Lost & Found SOP',
    steps: [
      'Record item type, color, distinguishing features, and last-known location.',
      'Check the immediate area and nearest concession/washroom.',
      'Direct the fan to the Lost & Found desk and log a claim reference.',
      'If the item is high-value (passport, wallet, phone), notify security.',
    ],
    escalateTo: 'Lost & Found Desk',
    incidentDraft: { type: 'lost_item', priority: 2, locationCode: 'FOOD-C', description: 'Fan reported a lost item. Details recorded; directed to Lost & Found.' },
  },
  medical: {
    title: 'Medical Escalation SOP',
    steps: [
      'Do not attempt diagnosis or treatment beyond basic first aid you are trained for.',
      'Call the nearest medical team (Medical Point 1) and give exact location.',
      'Keep the area clear and reassure the person; note symptoms and time.',
      'Guide medics in and hand over; do not move the person unless in immediate danger.',
    ],
    escalateTo: 'Medical Point 1 / On-site Medics',
    incidentDraft: { type: 'medical', priority: 4, locationCode: 'MED-1', description: 'Medical assistance requested. Nearest medical team notified; area kept clear.' },
  },
  crowd: {
    title: 'Crowd Congestion SOP',
    steps: [
      'Assess flow direction and identify the pinch point.',
      'Open or signpost an alternate route/gate and use clear hand signals.',
      'Radio the gate lead to balance entry across gates.',
      'Keep accessibility lanes clear at all times.',
    ],
    escalateTo: 'Gate Lead / Operations',
    incidentDraft: { type: 'crowd', priority: 3, locationCode: 'GATE-4', description: 'Crowd congestion building. Alternate route opened; gate lead notified to rebalance.' },
  },
  accessibility: {
    title: 'Accessibility Support SOP',
    steps: [
      'Ask the fan how they would like to be assisted — do not assume.',
      'Use step-free routes via the Accessibility Hub (ACC-1).',
      'Arrange an escort to the seat and confirm nearest accessible washroom.',
      'Never override the fan’s stated preference to save time.',
    ],
    escalateTo: 'Accessibility Hub',
    incidentDraft: { type: 'accessibility', priority: 3, locationCode: 'ACC-1', description: 'Accessibility support requested. Step-free route and escort arranged.' },
  },
  maintenance: {
    title: 'Maintenance Issue SOP',
    steps: [
      'Make the area safe and cordon off any hazard.',
      'Record the exact location and nature of the fault.',
      'Report to Operations/Facilities and note any power or water impact.',
      'Do not attempt electrical repairs; escalate power issues immediately.',
    ],
    escalateTo: 'Facilities / Operations',
    incidentDraft: { type: 'maintenance', priority: 2, locationCode: 'FOOD-C', description: 'Maintenance issue reported. Area made safe; facilities notified.' },
  },
};

export function fallbackVolunteerSop(req: VolunteerSopRequest): VolunteerSopResponse {
  const base = SOP_LIBRARY[req.scenario];
  const draft = { ...base.incidentDraft };
  if (req.zoneCode) draft.locationCode = req.zoneCode;
  if (req.details) draft.description = `${draft.description} Detail: ${req.details}`;
  return { ...base, incidentDraft: draft, fallbackUsed: true };
}

export function fallbackWhatIf(question: string, snapshot: DashboardSnapshot): WhatIfResponse {
  const q = question.toLowerCase();
  const impact: string[] = [];
  const mitigations: string[] = [];
  let riskLevel: WhatIfResponse['riskLevel'] = 'medium';
  let projectedZones: { code: string; occupancy: number }[] | undefined = undefined;

  if (q.includes('gate') && q.includes('close')) {
    impact.push('Crowd from the closed gate shifts to adjacent gates, raising their occupancy 15–25%.');
    impact.push('Average entry wait increases by an estimated 6–10 minutes near kickoff.');
    mitigations.push('Open the least-crowded alternate gate and add signage.');
    mitigations.push('Deploy 2–3 volunteers to guide redirected fans.');
    riskLevel = 'high';
    
    // Simulate Gate 4 closing and Gate 5 spiking
    projectedZones = [
      { code: 'GATE-4', occupancy: 0 },
      { code: 'GATE-5', occupancy: 95 }
    ];
  } else if (q.includes('rain') || q.includes('weather')) {
    impact.push('Queues slow as fans seek cover; concourse density rises.');
    impact.push('Slip risk increases on ramps and stairs.');
    mitigations.push('Open covered queuing and message fans to arrive early.');
    mitigations.push('Place wet-floor signage and prioritize accessibility lanes.');
    riskLevel = 'medium';
  } else if (q.includes('metro') || q.includes('transport') || q.includes('delay')) {
    impact.push('Late arrival surge in the final 20 minutes before kickoff.');
    mitigations.push('Stage extra staff at Metro Exit 2 and push transport alerts.');
    mitigations.push('Hold overflow parking open as a fallback.');
    riskLevel = 'medium';
  } else {
    impact.push('Localized load increase in the affected zones with knock-on queueing.');
    mitigations.push('Rebalance flow to lower-occupancy zones.');
    mitigations.push('Pre-position volunteers and monitor the next 10 minutes.');
    riskLevel = snapshot.healthScore < 70 ? 'high' : 'medium';
  }

  return { impact, mitigations, riskLevel, projectedZones, fallbackUsed: true };
}

export function fallbackMatchBrief(snapshot: DashboardSnapshot): MatchBriefResponse {
  const m = snapshot.match;
  return {
    brief: `Pre-match operations brief for ${m.homeTeam} vs ${m.awayTeam} (${m.stage}) at ${m.stadium.name}, ${m.stadium.hostCity}. Expected near-capacity attendance (venue ${m.stadium.capacity.toLocaleString()}). Current stadium health score ${snapshot.healthScore}/100. Transport shows parking at ${snapshot.transport.parkingUtilization}% and metro ${snapshot.transport.metroStatus}. ${snapshot.volunteers.length} volunteers rostered across gates, food, medical and accessibility.`,
    keyRisks: [
      'Gate 4 entry congestion in the 30 minutes before kickoff.',
      `Parking near capacity (${snapshot.transport.parkingUtilization}%) with high taxi demand.`,
      'Accessibility escort demand at peak arrival.',
    ],
    recommendedSetup: [
      'Pre-open Gate 5 and staff it early to balance entry.',
      'Activate overflow parking and push metro guidance.',
      'Position accessibility volunteers at ACC-1 and gates.',
      'Stage medical team at Medical Point 1.',
    ],
    fallbackUsed: true,
  };
}

export function fallbackEndMatch(snapshot: DashboardSnapshot): EndMatchReportResponse {
  const applied = snapshot.actionHistory.filter((a) => a.status === 'applied').length;
  const resolved = snapshot.incidents.filter((i) => i.status === 'resolved').length;
  return {
    report: `End-match report for ${snapshot.match.homeTeam} vs ${snapshot.match.awayTeam}. Final stadium health score ${snapshot.healthScore}/100. ${applied} AI recommendations applied and ${snapshot.incidents.length} incidents logged (${resolved} resolved). Peak crowd density reached ${snapshot.metrics.crowdDensity}%. Sustainability: ${snapshot.sustainability.electricityKwh} kWh electricity, ${snapshot.sustainability.waterLiters} L water, ${snapshot.sustainability.foodWasteKg} kg food waste.`,
    wins: [
      `${applied} proactive recommendations applied before issues escalated.`,
      'Entry flow balanced across gates via early Gate 5 opening.',
      'Accessibility requests handled with dedicated escorts.',
    ],
    improvements: [
      'Pre-stage overflow parking earlier to cut approach-road congestion.',
      'Add signage at Metro Exit 2 for late arrivals.',
      'Increase food-court staffing 45 minutes before kickoff.',
    ],
    fallbackUsed: true,
  };
}

export function fallbackTranslation(req: TranslationRequest): TranslationResponse {
  return {
    translatedText: `[${req.targetLanguage}] ${req.message}`,
    notes: 'Deterministic fallback: Gemini translation unavailable. Message passed through with target-language tag. Configure GEMINI_API_KEY for real translation.',
    fallbackUsed: true,
  };
}

export function fallbackAiSummary(snapshot: Omit<DashboardSnapshot, 'aiSummary'>): AiSummary {
  const risks: string[] = [];
  const busyGate = snapshot.zones.filter((z) => z.zoneType === 'gate').sort((a, b) => b.occupancy - a.occupancy)[0];
  if (busyGate && busyGate.occupancy >= 75) risks.push(`${busyGate.name} occupancy at ${busyGate.occupancy}% — congestion risk.`);
  if (snapshot.transport.parkingUtilization >= 85) risks.push(`Parking at ${snapshot.transport.parkingUtilization}% — near capacity.`);
  if (snapshot.metrics.weather === 'rain') risks.push('Rain affecting queues and walkways.');
  if (snapshot.metrics.incidentsOpen > 0) risks.push(`${snapshot.metrics.incidentsOpen} open incident(s) need attention.`);
  if (snapshot.metrics.powerStatus !== 'stable') risks.push(`Power status: ${snapshot.metrics.powerStatus}.`);
  if (risks.length === 0) risks.push('No critical risks — operations nominal.');

  return {
    summary: `Stadium health ${snapshot.healthScore}/100. ${snapshot.metrics.crowdDensity}% average crowd density, ${snapshot.metrics.incidentsOpen} open incidents, ${snapshot.metrics.volunteersActive}/${snapshot.metrics.volunteersTotal} volunteers active. ${snapshot.recommendations.filter((r) => r.status === 'pending').length} recommendation(s) awaiting decision.`,
    risks,
    fallbackUsed: true,
  };
}
