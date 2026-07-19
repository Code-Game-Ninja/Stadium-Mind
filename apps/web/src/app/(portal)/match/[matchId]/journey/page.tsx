'use client';
import toast from 'react-hot-toast';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type {
  MatchWithStadium,
  StadiumZone,
  FanJourneyPlan,
  ArrivalMethod,
  AccessibilityNeed,
  LiveMatchData,
} from '@stadiummind/shared';
import { ARRIVAL_LABELS, ACCESSIBILITY_LABELS } from '@stadiummind/shared';
import { api } from '@/lib/api';
import { formatKickoff, minutesToKickoff, cn } from '@/lib/utils';
import { Panel, PanelHeader, Spinner, StatusChip, Skeleton } from '@/components/ui';
import { LiveMatchCenter } from '@/components/LiveMatchCenter';
import { GlobalMatches } from '@/components/GlobalMatches';
import { StadiumMap } from '@/components/StadiumMap';
import { FanChat } from '@/components/FanChat';
import {
  ArrowLeft,
  Route,
  DoorOpen,
  Clock,
  AlertTriangle,
  Accessibility,
  Utensils,
  Bath,
  ShoppingBag,
  Droplet,
  Camera,
  Sparkles,
  Check,
  TrainFront,
  Car,
  Bus,
  CarTaxiFront,
  Footprints,
  MapPinned,
} from 'lucide-react';

const ARRIVAL_OPTIONS: { key: ArrivalMethod; icon: typeof Car }[] = [
  { key: 'metro', icon: TrainFront },
  { key: 'car', icon: Car },
  { key: 'bus', icon: Bus },
  { key: 'taxi', icon: CarTaxiFront },
  { key: 'walking', icon: Footprints },
];
const ACCESS_OPTIONS: AccessibilityNeed[] = ['none', 'wheelchair', 'senior', 'child', 'low_walking'];
const PREF_OPTIONS = [
  { key: 'wantsFood', label: 'Food', icon: Utensils },
  { key: 'wantsWashroom', label: 'Washroom', icon: Bath },
  { key: 'wantsMerchandise', label: 'Merch', icon: ShoppingBag },
  { key: 'wantsWater', label: 'Water', icon: Droplet },
  { key: 'wantsPhotoZone', label: 'Photo zone', icon: Camera },
] as const;

export default function JourneyPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const search = useSearchParams();
  const ticketId = search.get('ticket') || '';

  const [match, setMatch] = useState<MatchWithStadium | null>(null);
  const [zones, setZones] = useState<StadiumZone[]>([]);
  const [arrival, setArrival] = useState<ArrivalMethod>('metro');
  const [access, setAccess] = useState<AccessibilityNeed>('none');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ wantsFood: true, wantsWashroom: true });
  const [plan, setPlan] = useState<FanJourneyPlan | null>(null);
  const [liveData, setLiveData] = useState<LiveMatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [sosType, setSosType] = useState('medical');
  const [sosDesc, setSosDesc] = useState('');
  const [sosSending, setSosSending] = useState(false);

  async function handleLogout() {
    try {
      await api.fanLogout({ matchId, ticketId });
    } catch (e) {
      // ignore
    }
    window.location.replace('/match-hub');
  }

  async function handleSos() {
    setSosSending(true);
    try {
      await api.fanHelp({ matchId, ticketId, type: sosType, description: sosDesc });
      toast.success('Help request sent! A volunteer is on their way to your location.');
      setShowSos(false);
      setSosDesc('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSosSending(false);
    }
  }

  useEffect(() => {
    api.getMatch(matchId).then((r) => {
      setMatch(r.match);
      setZones(r.zones);
      if (r.liveMatchData) setLiveData(r.liveMatchData);
    });
  }, [matchId]);

  async function generate() {
    setLoading(true);
    setPlan(null);
    try {
      const r = await api.fanJourney({
        matchId,
        ticketId,
        arrivalMethod: arrival,
        preferences: { ...prefs, accessibilityNeed: access },
      });
      setPlan(r.plan);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const routeCodes = useMemo(() => {
    if (!plan) return [];
    // Build route from step locations that map to known zones.
    const codes: string[] = [];
    if (arrival === 'metro') codes.push('METRO-2');
    else if (arrival === 'car') codes.push('PARK-N');
    plan.steps.forEach((s) => {
      if (zones.some((z) => z.code === s.location) && !codes.includes(s.location)) codes.push(s.location);
    });
    return codes;
  }, [plan, zones, arrival]);

  if (loading || (!match && !ticketId)) {
    return (
      <>
        <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
          <Spinner className="h-8 w-8 text-blue-600" />
          <p className="text-slate-500 font-medium">Loading match portal...</p>
        </div>
      </>
    );
  }

  if (!ticketId) {
    return (
      <>
        <Panel className="max-w-md mx-auto mt-12 p-8 text-center bg-white shadow-xl">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Guest Profile</h2>
          <p className="text-slate-500 mb-6 leading-relaxed">You are viewing the portal in guest mode. Verify your ticket to unlock personalized live match features.</p>
          <Link href={`/match/${matchId}/ticket`} className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
            Verify Ticket
          </Link>
        </Panel>
      </>
    );
  }

  const mins = match ? minutesToKickoff(match.kickoffAt) : 0;

  return (
    <>
      {match && (
        <div className="mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-600 via-pitch-700 to-blue-800 p-6 sm:p-10 shadow-xl shadow-pitch-900/10">
          {/* Decorative shapes */}
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
             <MapPinned className="h-48 w-48 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white mb-4 border border-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live Match-Day Assistant
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-sm mb-2">
                {match.homeTeam} <span className="text-white/50 font-medium px-2 text-2xl sm:text-4xl">vs</span> {match.awayTeam}
              </h1>
              <div className="text-sm sm:text-base font-medium text-blue-100/90 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5"><MapPinned className="h-4 w-4 opacity-70" /> {match.stadium.name}</span>
                <span className="hidden sm:inline opacity-40">•</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 opacity-70" /> {formatKickoff(match.kickoffAt)}</span>
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-white text-sm font-bold">
                <Check className="h-4 w-4 text-green-400" /> Ticket {ticketId}
              </div>
              <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95 text-white text-xs font-bold w-full md:w-auto text-center border border-white/10">
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY CONTACTS */}
      <div className="mb-6 rounded-2xl border border-rose-100 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
               <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Need immediate assistance?</h3>
              <p className="mt-1 text-sm text-slate-500">
                Stadium staff and medical volunteers are stationed nearby and ready to help.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button onClick={() => setShowSos(true)} className="flex-1 sm:flex-none btn-primary bg-rose-600 hover:bg-rose-700 text-white border-none py-2.5 px-5 shadow-sm shadow-rose-200 font-bold transition-all active:scale-95">
              Request Volunteer
            </button>
            <a href="tel:911" className="flex-1 sm:flex-none btn-secondary py-2.5 px-5 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold bg-white transition-all text-center">
              Medical: 555-0100
            </a>
          </div>
        </div>
      </div>

      {showSos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-7 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Request Help</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">A stadium volunteer will be dispatched to your seat immediately.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Type of help needed</label>
                <select className="input py-2.5 bg-slate-50 border-slate-200 text-slate-900 font-medium" value={sosType} onChange={e => setSosType(e.target.value)}>
                  <option value="medical">Medical Assistance</option>
                  <option value="security">Security Issue</option>
                  <option value="lost_child">Lost Child</option>
                  <option value="spill">Spill / Clean up</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Details (optional)</label>
                <textarea className="input h-24 py-3 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 resize-none" placeholder="Briefly describe the issue..." value={sosDesc} onChange={e => setSosDesc(e.target.value)} />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors" onClick={() => setShowSos(false)}>Cancel</button>
              <button className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-transform active:scale-95 shadow-sm shadow-rose-200" onClick={handleSos} disabled={sosSending}>
                {sosSending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 h-[450px]">
          <LiveMatchCenter liveData={liveData || undefined} homeTeam={match?.homeTeam || 'Home'} awayTeam={match?.awayTeam || 'Away'} />
        </div>
        <div className="lg:col-span-1 h-[450px]">
          <GlobalMatches />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left column: preferences + plan */}
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Plan your arrival" icon={<Route className="h-4 w-4 text-pitch-400" />} />
            <div className="space-y-5 p-4">
              <div>
                <label className="label">Arrival method</label>
                <div className="grid grid-cols-5 gap-2">
                  {ARRIVAL_OPTIONS.map((a) => {
                    const Icon = a.icon;
                    const on = arrival === a.key;
                    return (
                      <button
                        key={a.key}
                        onClick={() => setArrival(a.key)}
                        title={ARRIVAL_LABELS[a.key]}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 text-[11px] font-bold transition-all',
                          on
                            ? 'border-pitch-500 bg-pitch-50 text-pitch-700 shadow-sm shadow-pitch-100 scale-105'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        <Icon className={cn("h-5 w-5", on ? "text-pitch-600" : "text-slate-400")} />
                        <span className="truncate w-full px-1">{ARRIVAL_LABELS[a.key]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">Preferences</label>
                <div className="flex flex-wrap gap-2.5">
                  {PREF_OPTIONS.map((p) => {
                    const Icon = p.icon;
                    const on = prefs[p.key];
                    return (
                      <button
                        key={p.key}
                        onClick={() => setPrefs((s) => ({ ...s, [p.key]: !s[p.key] }))}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all',
                          on
                            ? 'border-pitch-500 bg-pitch-50 text-pitch-700 shadow-sm shadow-pitch-100'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        {on ? <Check className="h-4 w-4 text-pitch-600" /> : <Icon className="h-4 w-4 opacity-70" />} 
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Accessibility need</label>
                <div className="relative">
                  <select className="w-full appearance-none rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-pitch-500 focus:ring-4 focus:ring-pitch-500/20" value={access} onChange={(e) => setAccess(e.target.value as AccessibilityNeed)}>
                    {ACCESS_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {ACCESSIBILITY_LABELS[a]}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="pt-4 pb-2">
                <button className="w-full rounded-xl bg-pitch-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pitch-600/30 transition-all hover:bg-pitch-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2" onClick={generate} disabled={loading}>
                  <Sparkles className="h-5 w-5" /> {loading ? 'Generating your custom plan...' : 'Generate my journey'}
                </button>
              </div>
            </div>
          </Panel>

          {loading && (
            <Panel className="space-y-3 p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </Panel>
          )}
          {plan && <JourneyPlanCard plan={plan} minsToKickoff={mins} />}
        </div>

        {/* Right column: map + chat */}
        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Your route on the stadium map"
              icon={<DoorOpen className="h-4 w-4 text-pitch-400" />}
              action={plan?.entryGate ? <StatusChip tone="blue">Enter via {plan.entryGate}</StatusChip> : undefined}
            />
            <div className="p-4">
              {zones.length > 0 ? (
                <StadiumMap zones={zones} routeCodes={routeCodes} highlightCodes={plan ? [plan.entryGate] : []} />
              ) : (
                <div className="py-10">
                  <Spinner label="Loading map…" />
                </div>
              )}
              {!plan && zones.length > 0 && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Generate your journey to see the recommended gate-to-seat route highlighted here.
                </p>
              )}
            </div>
          </Panel>

          <FanChat matchId={matchId} ticketId={ticketId} />
        </div>
      </div>
    </>
  );
}

function JourneyPlanCard({ plan, minsToKickoff }: { plan: FanJourneyPlan; minsToKickoff: number }) {
  return (
    <Panel className="animate-fade-in">
      <PanelHeader
        title="AI journey plan"
        icon={<Sparkles className="h-4 w-4 text-pitch-400" />}
        action={
          <StatusChip tone={plan.fallbackUsed ? 'amber' : 'green'}>
            {plan.fallbackUsed ? 'Offline AI' : 'Gemini'}
          </StatusChip>
        }
      />
      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-slate-300">{plan.summary}</p>

        <div className="flex flex-wrap gap-2 text-xs">
          <StatusChip tone="green">
            <DoorOpen className="h-3 w-3" /> Entry: {plan.entryGate}
          </StatusChip>
          {plan.alternateGate && <StatusChip tone="slate">Alt gate: {plan.alternateGate}</StatusChip>}
          <StatusChip tone="blue">
            <Clock className="h-3 w-3" /> {minsToKickoff > 0 ? `${minsToKickoff} min to kickoff` : 'Kickoff reached'}
          </StatusChip>
        </div>

        {/* Connected timeline */}
        <ol className="relative space-y-2 pl-1">
          {plan.steps.map((s, i) => (
            <li key={s.order} className="relative flex gap-3">
              {i < plan.steps.length - 1 && (
                <span className="absolute left-[11px] top-7 h-[calc(100%-12px)] w-px bg-slate-200" aria-hidden />
              )}
              <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitch-600 text-xs font-bold text-white ring-4 ring-white">
                {s.order}
              </span>
              <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">{s.label}</span>
                  <span className="shrink-0 text-xs font-medium text-slate-500">{s.durationMinutes} min</span>
                </div>
                <div className="text-xs text-slate-500">{s.location}</div>
                {s.note && <div className="mt-1 text-xs font-medium text-pitch-700">{s.note}</div>}
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <span className="text-slate-500">Arrival guidance: </span>
          <span className="font-medium text-slate-800">{plan.arrivalEstimate}</span>
        </div>

        {plan.warnings.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-signal-yellow/25 bg-signal-yellow/[0.06] p-3">
            {plan.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-signal-yellow">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
              </div>
            ))}
          </div>
        )}

        {plan.accessibilityNotes.length > 0 && (
          <div className="rounded-lg border border-signal-blue/30 bg-signal-blue/10 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-signal-blue">
              <Accessibility className="h-3.5 w-3.5" /> Accessibility
            </div>
            {plan.accessibilityNotes.map((n, i) => (
              <div key={i} className="text-xs text-slate-300">
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
