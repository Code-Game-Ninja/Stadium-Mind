// AI layer. Calls Gemini when GEMINI_API_KEY is set, otherwise uses the
// deterministic fallbacks from @stadiummind/shared. Every function returns the
// same shape regardless of path and never throws to the caller.

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  fallbackFanJourney,
  fallbackFanChat,
  fallbackVolunteerSop,
  fallbackWhatIf,
  fallbackMatchBrief,
  fallbackEndMatch,
  fallbackTranslation,
  fallbackAiSummary,
  type AiSummary,
  type FanJourneyRequest,
  type FanJourneyPlan,
  type FanChatResponse,
  type VolunteerSopRequest,
  type VolunteerSopResponse,
  type WhatIfRequest,
  type WhatIfResponse,
  type MatchBriefResponse,
  type EndMatchReportResponse,
  type TranslationRequest,
  type TranslationResponse,
  type Ticket,
  type MatchWithStadium,
  type StadiumZone,
  type DashboardSnapshot,
  type MerchandiseItem,
} from '@stadiummind/shared';

const API_KEY = process.env.GEMINI_API_KEY?.trim();
const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
export const geminiEnabled = Boolean(API_KEY);

const client = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SHARED_SYSTEM = `You are part of StadiumMind AI, the AI operating system for FIFA World Cup 2026 stadium operations.
Use only the trusted context supplied. Never invent gates, matches, medical instructions, transport schedules, or emergency procedures not in context.
Guardrails: Never claim a real FIFA ticket is valid — say it was verified against the demo ticket database. Never give medical diagnosis; advise escalation to the nearest medical team. Never order security actions requiring legal authority; recommend escalation. Never override accessibility preferences to optimize speed.
Return ONLY valid minified JSON matching the requested schema, with no markdown fences or commentary.`;

async function callGeminiJson<T>(prompt: string): Promise<T | null> {
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: SHARED_SYSTEM,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('[ai] Gemini call failed, using fallback:', (err as Error).message);
    return null;
  }
}

export async function generateFanJourney(
  req: FanJourneyRequest,
  ticket: Ticket,
  match: MatchWithStadium,
  zones: StadiumZone[]
): Promise<FanJourneyPlan> {
  const gemini = await callGeminiJson<Partial<FanJourneyPlan>>(
    `Create a personalized match-day journey plan as JSON with keys: summary, entryGate, alternateGate, steps (array of {order,label,location,durationMinutes,note}), arrivalEstimate, warnings (array), accessibilityNotes (array).
Context: match=${match.homeTeam} vs ${match.awayTeam} at ${match.stadium.name}, kickoff ${match.kickoffAt}.
Ticket (verified against demo ticket database): seat ${ticket.seatLabel}, section ${ticket.sectionCode}, recommended gate ${ticket.recommendedGateCode}.
Arrival: ${req.arrivalMethod}. Preferences: ${JSON.stringify(req.preferences)}.
Zones with live occupancy: ${JSON.stringify(zones.map((z) => ({ code: z.code, name: z.name, type: z.zoneType, occupancy: z.occupancy })))}.
Suggest a less-crowded alternate gate if the recommended gate is busy. Respect accessibility needs strictly.`
  );
  if (gemini && Array.isArray(gemini.steps) && gemini.summary) {
    return {
      summary: gemini.summary,
      entryGate: gemini.entryGate || ticket.recommendedGateCode,
      alternateGate: gemini.alternateGate,
      steps: gemini.steps as FanJourneyPlan['steps'],
      arrivalEstimate: gemini.arrivalEstimate || 'Arrive at least 45 minutes before kickoff.',
      warnings: gemini.warnings || [],
      accessibilityNotes: gemini.accessibilityNotes || [],
      fallbackUsed: false,
    };
  }
  return fallbackFanJourney(req, ticket, match, zones);
}

export async function generateFanChat(
  message: string,
  ticket: Ticket | undefined,
  match: MatchWithStadium | undefined,
  zones: StadiumZone[],
  merchandise: MerchandiseItem[]
): Promise<FanChatResponse> {
  const gemini = await callGeminiJson<{ reply: string }>(
    `Answer this fan question as JSON {"reply": string}. Be concise and practical (gate, route, food, washroom, seat, accessibility, merchandise).
Question: ${JSON.stringify(message)}.
${ticket ? `Ticket (verified against demo ticket database): seat ${ticket.seatLabel}, section ${ticket.sectionCode}, gate ${ticket.recommendedGateCode}.` : 'No ticket verified.'}
${match ? `Match: ${match.homeTeam} vs ${match.awayTeam} at ${match.stadium.name}, kickoff ${match.kickoffAt}.` : ''}
Zones: ${JSON.stringify(zones.map((z) => ({ code: z.code, name: z.name, type: z.zoneType, occupancy: z.occupancy })))}.
Merchandise Inventory: ${JSON.stringify(merchandise.map(m => ({ name: m.name, price: m.price, stock: m.stock, exclusive: m.isExclusive, shops: m.exclusiveShops })))}.`
  );
  if (gemini?.reply) return { reply: gemini.reply, fallbackUsed: false };
  return fallbackFanChat(message, ticket, match, zones);
}

export async function generateVolunteerSop(req: VolunteerSopRequest): Promise<VolunteerSopResponse> {
  const gemini = await callGeminiJson<Partial<VolunteerSopResponse>>(
    `Provide volunteer SOP guidance as JSON {title, steps (array), escalateTo, incidentDraft {type, priority, locationCode, description}}.
Scenario: ${req.scenario}. Zone: ${req.zoneCode || 'unspecified'}. Details: ${req.details || 'none'}.
Give clear numbered SOP steps and an escalation point. incidentDraft.type must be one of: medical, security, maintenance, lost_child, lost_item, crowd, accessibility, transport.`
  );
  if (gemini && Array.isArray(gemini.steps) && gemini.incidentDraft) {
    return {
      title: gemini.title || 'SOP Guidance',
      steps: gemini.steps as string[],
      escalateTo: gemini.escalateTo || 'Operations',
      incidentDraft: gemini.incidentDraft as VolunteerSopResponse['incidentDraft'],
      fallbackUsed: false,
    };
  }
  return fallbackVolunteerSop(req);
}

export async function generateWhatIf(req: WhatIfRequest, snapshot: DashboardSnapshot): Promise<WhatIfResponse> {
  const gemini = await callGeminiJson<Partial<WhatIfResponse>>(
    `Analyze a what-if scenario WITHOUT changing state. Return JSON {impact (array), mitigations (array), riskLevel ("low"|"medium"|"high"), projectedZones (array of {code, occupancy} if the scenario affects occupancies)}.
Question: ${JSON.stringify(req.question)}.
Current snapshot: health ${snapshot.healthScore}, crowd ${snapshot.metrics.crowdDensity}%, parking ${snapshot.transport.parkingUtilization}%, metro ${snapshot.transport.metroStatus}, weather ${snapshot.metrics.weather}, openIncidents ${snapshot.metrics.incidentsOpen}.
Zones: ${JSON.stringify(snapshot.zones.map((z) => ({ code: z.code, occupancy: z.occupancy })))}.
If the scenario affects zone occupancies, include the 'projectedZones' array with the new expected occupancy percentage (0-100) for each affected zone.`
  );
  if (gemini && Array.isArray(gemini.impact)) {
    return {
      impact: gemini.impact,
      mitigations: gemini.mitigations || [],
      riskLevel: (gemini.riskLevel as WhatIfResponse['riskLevel']) || 'medium',
      projectedZones: gemini.projectedZones,
      fallbackUsed: false,
    };
  }
  return fallbackWhatIf(req.question, snapshot);
}

export async function generateMatchBrief(snapshot: DashboardSnapshot): Promise<MatchBriefResponse> {
  const gemini = await callGeminiJson<Partial<MatchBriefResponse>>(
    `Write a pre-match operations brief as JSON {brief (string), keyRisks (array), recommendedSetup (array)}.
Match: ${snapshot.match.homeTeam} vs ${snapshot.match.awayTeam}, ${snapshot.match.stage}, at ${snapshot.match.stadium.name} (${snapshot.match.stadium.hostCity}), capacity ${snapshot.match.stadium.capacity}.
Health ${snapshot.healthScore}, parking ${snapshot.transport.parkingUtilization}%, metro ${snapshot.transport.metroStatus}, volunteers ${snapshot.volunteers.length}.`
  );
  if (gemini?.brief) {
    return {
      brief: gemini.brief,
      keyRisks: gemini.keyRisks || [],
      recommendedSetup: gemini.recommendedSetup || [],
      fallbackUsed: false,
    };
  }
  return fallbackMatchBrief(snapshot);
}

export async function generateEndMatch(snapshot: DashboardSnapshot): Promise<EndMatchReportResponse> {
  const gemini = await callGeminiJson<Partial<EndMatchReportResponse>>(
    `Write an after-action end-match report as JSON {report (string), wins (array), improvements (array)}.
Match: ${snapshot.match.homeTeam} vs ${snapshot.match.awayTeam}. Health ${snapshot.healthScore}. Incidents ${snapshot.incidents.length}. Applied actions ${snapshot.actionHistory.filter((a) => a.status === 'applied').length}. Peak crowd ${snapshot.metrics.crowdDensity}%.
Sustainability: ${JSON.stringify(snapshot.sustainability)}.`
  );
  if (gemini?.report) {
    return {
      report: gemini.report,
      wins: gemini.wins || [],
      improvements: gemini.improvements || [],
      fallbackUsed: false,
    };
  }
  return fallbackEndMatch(snapshot);
}

export async function generateTranslation(req: TranslationRequest): Promise<TranslationResponse> {
  const gemini = await callGeminiJson<Partial<TranslationResponse>>(
    `Translate a short fan-volunteer message. Return JSON {translatedText (string), notes (string)}.
Target language: ${req.targetLanguage}. Message: ${JSON.stringify(req.message)}. Preserve operational meaning.`
  );
  if (gemini?.translatedText) {
    return { translatedText: gemini.translatedText, notes: gemini.notes || '', fallbackUsed: false };
  }
  return fallbackTranslation(req);
}

export async function generateCommentary(
  shorthand: string,
  match: MatchWithStadium,
  score: { home: number, away: number, minute: number }
): Promise<{ text: string }> {
  const gemini = await callGeminiJson<{ text: string }>(
    `Convert this shorthand match event into professional, engaging live sports play-by-play commentary (1-2 sentences).
Context: ${match.homeTeam} vs ${match.awayTeam}. Current score: ${score.home}-${score.away}, Minute: ${score.minute}.
Shorthand: "${shorthand}"
Return as JSON: {"text": string}`
  );
  if (gemini && gemini.text) {
    return { text: gemini.text };
  }
  return { text: `Minute ${score.minute}: ${shorthand} (Fallback AI)` };
}

export async function generateVoiceAssistant(message: string): Promise<{ reply: string }> {
  const gemini = await callGeminiJson<{ reply: string }>(
    `You are a helpful, concise AI voice assistant for stadium volunteers. Keep your answer to 1-3 short sentences, easily spoken by TTS. Question: ` + JSON.stringify(message) + `\nReturn JSON {"reply": string}`
  );
  if (gemini?.reply) {
    return { reply: gemini.reply };
  }
  return { reply: "I am offline, but I am here to help. What do you need?" };
}

// Proactive live-ops briefing. Runs on a schedule (see server.ts) to push a
// fresh AI read of the current situation to the organizer without them asking.
// Falls back to the deterministic summary when Gemini is unavailable.
export async function generateOpsBriefing(
  snapshot: Omit<DashboardSnapshot, 'aiSummary'>
): Promise<AiSummary> {
  const busiest = [...snapshot.zones].sort((a, b) => b.occupancy - a.occupancy).slice(0, 3);
  const gemini = await callGeminiJson<Partial<AiSummary>>(
    `Write a short live operations briefing for the stadium organizer as JSON {summary (1-2 sentences, string), risks (array of short strings)}.
This is a periodic proactive update — be specific about what changed and what needs attention now.
Match: ${snapshot.match.homeTeam} vs ${snapshot.match.awayTeam} at ${snapshot.match.stadium.name}.
Health ${snapshot.healthScore}/100. Avg crowd density ${snapshot.metrics.crowdDensity}%. Open incidents ${snapshot.metrics.incidentsOpen}. Volunteers ${snapshot.metrics.volunteersActive}/${snapshot.metrics.volunteersTotal}. Power ${snapshot.metrics.powerStatus}. Weather ${snapshot.metrics.weather}. Parking ${snapshot.transport.parkingUtilization}%, metro ${snapshot.transport.metroStatus}.
Busiest zones: ${busiest.map((z) => `${z.name} ${z.occupancy}%`).join(', ')}.
Pending recommendations: ${snapshot.recommendations.filter((r) => r.status === 'pending').length}.`
  );
  if (gemini?.summary) {
    return {
      summary: gemini.summary,
      risks: gemini.risks || [],
      fallbackUsed: false,
    };
  }
  return fallbackAiSummary(snapshot);
}
