'use client';
import toast from 'react-hot-toast';

import { useEffect, useState } from 'react';
import type {
  MatchWithStadium,
  StadiumZone,
  VolunteerSopResponse,
  IncidentType,
  TranslationResponse,
} from '@stadiummind/shared';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import { useMatchSnapshot } from '@/lib/useSocket';
import { LoginGate, LogoutButton } from '@/components/LoginGate';
import { MobileTabBar } from '@/components/MobileTabBar';
import { Panel, PanelHeader, StatusChip, Spinner, PageShell, EmptyState } from '@/components/ui';
import {
  HardHat,
  Baby,
  PackageSearch,
  HeartPulse,
  Users,
  Accessibility,
  Wrench,
  ClipboardList,
  Languages,
  Send,
  CheckCircle2,
  MapPin,
  Loader2,
  ShieldAlert,
  Gauge,
  CalendarDays,
  Volume2,
  Mic,
} from 'lucide-react';

const SCENARIOS = [
  { key: 'lost_child', label: 'Lost child', icon: Baby },
  { key: 'lost_item', label: 'Lost item', icon: PackageSearch },
  { key: 'medical', label: 'Medical', icon: HeartPulse },
  { key: 'crowd', label: 'Crowd', icon: Users },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
] as const;

const INCIDENT_TYPES: IncidentType[] = ['medical', 'security', 'maintenance', 'lost_child', 'lost_item', 'crowd', 'accessibility', 'transport'];

export default function VolunteerPage() {
  return (
    <LoginGate role="volunteer" title="Volunteer sign in">
      {(session, onLogout) => <VolunteerShell email={session.email} onLogout={onLogout} />}
    </LoginGate>
  );
}

function VolunteerShell({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [matches, setMatches] = useState<MatchWithStadium[]>([]);
  const [matchId, setMatchId] = useState('');
  const [zones, setZones] = useState<StadiumZone[]>([]);
  const [assignedZone, setAssignedZone] = useState('');
  // Mobile section switcher — desktop shows everything, mobile shows one section at a time.
  const [mobileSection, setMobileSection] = useState<'overview' | 'sop' | 'report' | 'feed' | 'translate'>('overview');
  const selectSection = (s: 'overview' | 'sop' | 'report' | 'feed' | 'translate') => {
    setMobileSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { snapshot } = useMatchSnapshot(matchId);

  useEffect(() => {
    if (snapshot?.volunteers) {
      const vol = snapshot.volunteers.find((v: any) => v.email === email);
      if (vol && vol.assignedZoneCode) {
        setAssignedZone(vol.assignedZoneCode);
      }
    }
  }, [snapshot, email]);

  useEffect(() => {
    api.getMatches().then((r) => {
      setMatches(r.matches);
      if (r.matches[0]) setMatchId(r.matches[0].id);
    });
  }, []);

  useEffect(() => {
    if (matchId) {
      localStorage.setItem('stadiummind:active_match_id', matchId);
      window.dispatchEvent(new Event('stadiummind:match_changed'));
      api.getMatch(matchId).then((r) => setZones(r.zones));
    }
  }, [matchId]);

  const zone = zones.find((z) => z.code === assignedZone);
  const openIncidents = (snapshot?.incidents ?? []).filter((i: any) => i.status !== 'resolved');
  const zoneIncidents = openIncidents.filter((i: any) => i.locationCode === assignedZone);
  const activeVolunteers = (snapshot?.volunteers ?? []).filter((v: any) => v.applicationStatus === 'approved').length;
  const currentMatch = matches.find((m) => m.id === matchId);

  return (
    <PageShell className="max-w-6xl">
      {/* ---------- Hero header ---------- */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-ink p-6 sm:p-8 shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-[0.04] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-lime/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-lime/10 blur-[120px]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-ink shadow-md">
              <HardHat className="h-7 w-7" />
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-lime">Volunteer Workspace</div>
              <h1 className="text-2xl font-black tracking-tight text-white">Hi, {email.split('@')[0]}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-white/50">
                <CalendarDays className="h-3.5 w-3.5" />
                {currentMatch ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam}` : 'Select a match'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-ink-600 bg-ink-800 px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lime animate-pulse" />
              {currentMatch ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam}` : 'Loading match...'}
            </div>
            <LogoutButton onLogout={onLogout} label="Sign out" />
          </div>
        </div>

        {/* Assignment + shift status row */}
        <div className="relative z-10 mt-6 flex flex-col gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime/15 text-lime">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Assigned zone</div>
              <div className="text-sm font-semibold text-white">
                {zone ? zone.name : (assignedZone || 'Not Assigned')} <span className="font-mono text-xs text-white/40">({assignedZone || 'N/A'})</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['crowd guidance', 'english', 'spanish'].map((s) => (
              <span key={s} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                {s}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[11px] font-bold text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
              </span>
              On shift
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Stat tiles (Overview) ---------- */}
      <div className={cn('mb-6 grid-cols-2 gap-4 lg:grid-cols-4', mobileSection === 'overview' ? 'grid' : 'hidden md:grid')}>
        <StatCard
          icon={ShieldAlert}
          label="Open incidents"
          value={openIncidents.length}
          hint="Across venue"
          accent={openIncidents.length > 0 ? 'amber' : 'lime'}
        />
        <StatCard
          icon={MapPin}
          label="In my zone"
          value={zoneIncidents.length}
          hint={assignedZone || 'Unassigned'}
          accent={zoneIncidents.length > 0 ? 'red' : 'ink'}
        />
        <StatCard
          icon={Gauge}
          label="My zone load"
          value={zone ? `${zone.occupancy}%` : '—'}
          hint={zone?.name ?? 'No zone'}
          accent="ink"
          progress={zone?.occupancy}
        />
        <StatCard
          icon={Users}
          label="Active crew"
          value={activeVolunteers}
          hint="Approved volunteers"
          accent="lime"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] pb-28 md:pb-0">
        <div className="min-w-0 space-y-6">
          <div className={cn('animate-fade-in-fast', mobileSection === 'sop' ? 'block' : 'hidden md:block')}>
            <SopAssistant matchId={matchId} zoneCode={assignedZone} />
          </div>
          <div className={cn('animate-fade-in-fast', mobileSection === 'feed' ? 'block' : 'hidden md:block')}>
            {snapshot && <VolunteerIncidentFeed incidents={snapshot.incidents} />}
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <div className={cn('animate-fade-in-fast', mobileSection === 'report' ? 'block' : 'hidden md:block')}>
            <IncidentForm matchId={matchId} zones={zones} defaultZone={assignedZone} />
          </div>
          <div className={cn('space-y-6 animate-fade-in-fast', mobileSection === 'report' ? 'block' : 'hidden md:block')}>
            <LostFoundForm matchId={matchId} defaultZone={assignedZone} />
            <ResourceRequestForm matchId={matchId} defaultZone={assignedZone} />
          </div>
          <div className={cn('animate-fade-in-fast flex flex-col gap-6', mobileSection === 'translate' ? 'flex' : 'hidden md:flex')}>
            <VoiceAssistant />
            <TranslationHelper />
          </div>
        </div>
      </div>

      <MobileTabBar
        items={[
          { label: 'Overview', icon: Gauge, onClick: () => selectSection('overview'), active: mobileSection === 'overview' },
          { label: 'SOP', icon: ClipboardList, onClick: () => selectSection('sop'), active: mobileSection === 'sop' },
          { label: 'Report', icon: Send, onClick: () => selectSection('report'), active: mobileSection === 'report' },
          { label: 'Feed', icon: ShieldAlert, onClick: () => selectSection('feed'), active: mobileSection === 'feed' },
          { label: 'Translate', icon: Languages, onClick: () => selectSection('translate'), active: mobileSection === 'translate' },
        ]}
      />
    </PageShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint: string;
  accent: 'lime' | 'ink' | 'amber' | 'red';
  progress?: number;
}) {
  const accents = {
    lime: { chip: 'bg-lime text-ink', bar: 'bg-lime', value: 'text-ink' },
    ink: { chip: 'bg-ink text-lime', bar: 'bg-ink', value: 'text-ink' },
    amber: { chip: 'bg-amber-400 text-ink', bar: 'bg-amber-400', value: 'text-amber-600' },
    red: { chip: 'bg-red-500 text-white', bar: 'bg-red-500', value: 'text-red-600' },
  }[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 will-change-transform">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-110', accents.chip)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className={cn('mt-3 text-3xl font-black tabular-nums tracking-tight', accents.value)}>{value}</div>
      {progress !== undefined ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-[width] duration-700', accents.bar)}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      ) : (
        <div className="mt-1.5 truncate text-[11px] font-semibold text-slate-400">{hint}</div>
      )}
    </div>
  );
}

function SopAssistant({ matchId, zoneCode }: { matchId: string; zoneCode: string }) {
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]['key']>('lost_child');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState<VolunteerSopResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [filing, setFiling] = useState(false);

  async function ask() {
    setLoading(true);
    setResult(null);
    setDrafted(false);
    try {
      setResult(await api.volunteerSop({ matchId, scenario, zoneCode, details }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function fileDraft() {
    if (!result || filing) return;
    setFiling(true);
    try {
      await api.createIncident({ matchId, ...result.incidentDraft });
      setDrafted(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setFiling(false);
    }
  }

  return (
    <Panel className="bg-white">
      <PanelHeader
        title="AI SOP Assistant"
        subtitle="Pick a scenario for instant step-by-step guidance"
        icon={<ClipboardList className="h-4 w-4 text-ink" />}
      />
      <div className="space-y-4 p-4 bg-slate-50/10">
        <div className="grid grid-cols-3 gap-2.5">
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            const active = scenario === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setScenario(s.key)}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-[11px] font-bold transition-all duration-200',
                  active
                    ? 'border-ink bg-ink text-white shadow-md shadow-ink/20 -translate-y-0.5'
                    : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-ink/30 hover:bg-cream'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    active ? 'bg-lime text-ink' : 'bg-slate-100 text-slate-500 group-hover:bg-lime/30 group-hover:text-ink'
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        <div>
          <label className="label">Details (optional)</label>
          <textarea className="input h-16 text-xs font-semibold" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add specifics for the AI…" />
        </div>

        <button className="btn-primary w-full text-xs font-bold" onClick={ask} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
          {loading ? 'Getting SOP…' : 'Get SOP guidance'}
        </button>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Spinner label="Consulting SOP library…" />
          </div>
        )}

        {result && (
          <div className="animate-fade-in-fast space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">{result.title}</span>
              <StatusChip tone={result.fallbackUsed ? 'amber' : 'green'}>{result.fallbackUsed ? 'Offline AI' : 'Gemini'}</StatusChip>
            </div>
            <ol className="list-decimal space-y-1.5 pl-4 text-xs font-medium leading-relaxed text-slate-600 marker:text-pitch-600 marker:font-bold">
              {result.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <div className="flex items-center gap-2 rounded-lg border border-signal-amber/20 bg-amber-50/55 px-3 py-2 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-signal-amber" />
              <span className="text-slate-400">Escalate to:</span>
              <span className="font-bold text-signal-amber">{result.escalateTo}</span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              {drafted ? (
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <CheckCircle2 className="h-4 w-4" /> Incident filed from SOP draft.
                </div>
              ) : (
                <button className="btn-ghost w-full text-xs" onClick={fileDraft} disabled={filing}>
                  {filing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {filing ? 'Filing...' : 'File incident from draft'}
                  <StatusChip tone="slate">
                    {result.incidentDraft.type} • P{result.incidentDraft.priority}
                  </StatusChip>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function IncidentForm({ matchId, zones, defaultZone }: { matchId: string; zones: StadiumZone[]; defaultZone: string }) {
  const [type, setType] = useState<IncidentType>('crowd');
  const [priority, setPriority] = useState(3);
  const [location, setLocation] = useState(defaultZone);
  const [description, setDescription] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!description.trim() || busy) return;
    setBusy(true);
    try {
      await api.createIncident({ matchId, type, priority, locationCode: location, description });
      setDone(true);
      setDescription('');
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="bg-white">
      <PanelHeader title="Report incident" icon={<ClipboardList className="h-4 w-4 text-signal-amber" />} />
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input text-xs font-semibold py-1.5" value={type} onChange={(e) => setType(e.target.value as IncidentType)}>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority (1–5)</label>
            <select className="input text-xs font-semibold py-1.5" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>P{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Location</label>
          <select className="input text-xs font-semibold py-1.5" value={location} onChange={(e) => setLocation(e.target.value)}>
            {zones.map((z) => <option key={z.code} value={z.code}>{z.name} ({z.code})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input h-16 text-xs font-semibold" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened…" />
        </div>
        <button className="btn-primary w-full text-xs font-bold" onClick={submit} disabled={busy || !description.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {done ? 'Reported!' : 'Submit incident'}
        </button>
        {done && (
          <div className="flex items-center gap-2 rounded-lg border border-pitch-500/20 bg-pitch-500/5 px-3 py-2 text-xs font-bold text-ink">
            <CheckCircle2 className="h-4 w-4" /> Incident sent to the command center.
          </div>
        )}
      </div>
    </Panel>
  );
}

function LostFoundForm({ matchId, defaultZone }: { matchId: string; defaultZone: string }) {
  const [item, setItem] = useState('');
  const [location, setLocation] = useState(defaultZone);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!item.trim() || busy) return;
    setBusy(true);
    try {
      await api.createIncident({
        matchId,
        type: 'lost_item',
        priority: 2,
        locationCode: location,
        description: `Lost & Found: ${item}`,
      });
      setDone(true);
      setItem('');
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="bg-white">
      <PanelHeader title="Lost & Found" icon={<PackageSearch className="h-4 w-4 text-signal-blue" />} />
      <div className="space-y-3 p-4">
        <div>
          <label className="label">Item description</label>
          <input className="input text-xs font-semibold" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. Blue backpack, black wallet" />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input text-xs font-semibold" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <button className="btn-ghost w-full text-xs font-bold" onClick={submit} disabled={!item.trim() || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
          {done ? 'Logged!' : 'Log lost item'}
        </button>
        {done && (
          <div className="flex items-center gap-2 rounded-lg border border-pitch-500/20 bg-pitch-500/5 px-3 py-2 text-xs font-bold text-ink">
            <CheckCircle2 className="h-4 w-4" /> Logged to Lost &amp; Found.
          </div>
        )}
      </div>
    </Panel>
  );
}

function VoiceAssistant() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  async function askAssistant(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    setReply('');
    try {
      const res = await api.voiceAssistant({ message: text });
      setReply(res.reply);
      speak(res.reply);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setMessage(transcript);
      askAssistant(transcript);
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        toast.error(`Microphone error: ${e.error}`);
      }
    };
    recognition.onend = () => setListening(false);

    recognition.start();
  }

  return (
    <Panel className="bg-white border-lime/50 shadow-lime/5">
      <PanelHeader title="AI Voice Assistant" icon={<Mic className="h-4 w-4 text-lime" />} />
      <div className="space-y-3 p-4">
        <div className="flex flex-col items-center justify-center py-4">
          <button 
            onClick={startListening} 
            disabled={busy}
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 shadow-lg", 
              listening ? "bg-red-500 text-white animate-pulse shadow-red-500/40 scale-110" : 
              busy ? "bg-slate-200 text-slate-400" : "bg-ink text-lime hover:scale-105 shadow-ink/20"
            )}
          >
            {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className="h-8 w-8" />}
          </button>
          <div className="mt-4 text-xs font-bold text-slate-400">
            {listening ? 'Listening...' : busy ? 'Thinking...' : 'Tap to speak'}
          </div>
        </div>
        
        {(message || reply) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {message && (
              <div className="flex justify-end">
                <div className="bg-lime/20 text-ink rounded-2xl rounded-tr-sm px-3 py-2 text-xs font-semibold max-w-[85%]">
                  {message}
                </div>
              </div>
            )}
            {reply && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-700 rounded-2xl rounded-tl-sm px-3 py-2 text-xs font-semibold max-w-[85%] relative group">
                  {reply}
                  <button 
                    onClick={() => speak(reply)} 
                    className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-signal-blue transition-all"
                    title="Repeat audio"
                  >
                    <Volume2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function TranslationHelper() {
  const [message, setMessage] = useState('');
  const [lang, setLang] = useState('Spanish');
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const LANG_CODES: Record<string, string> = {
    Spanish: 'es-ES',
    French: 'fr-FR',
    Portuguese: 'pt-PT',
    Arabic: 'ar-SA',
    Hindi: 'hi-IN',
    Japanese: 'ja-JP',
  };

  async function translate() {
    if (!message.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await api.translate({ targetLanguage: lang, message }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function speak() {
    if (!result?.translatedText) return;
    const utterance = new SpeechSynthesisUtterance(result.translatedText);
    utterance.lang = LANG_CODES[lang] || 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setMessage(transcript);
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        toast.error(`Microphone error: ${e.error}`);
      }
    };
    recognition.onend = () => setListening(false);

    recognition.start();
  }

  return (
    <Panel className="bg-white">
      <PanelHeader title="Translation helper" icon={<Languages className="h-4 w-4 text-ink" />} />
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div>
            <label className="label">Message</label>
            <div className="relative">
              <input className="input text-xs font-semibold pr-8" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message to a fan..." />
              <button 
                onClick={startListening} 
                className={cn("absolute right-1.5 top-1.5 p-1 rounded-md transition-colors", listening ? "text-red-500 bg-red-50" : "text-slate-400 hover:text-signal-blue hover:bg-slate-100")}
                title="Dictate message"
              >
                <Mic className={cn("h-4 w-4", listening && "animate-pulse")} />
              </button>
            </div>
          </div>
          <div>
            <label className="label">Language</label>
            <select className="input text-xs font-semibold py-1.5" value={lang} onChange={(e) => setLang(e.target.value)}>
              {['Spanish', 'French', 'Portuguese', 'Arabic', 'Hindi', 'Japanese'].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-ghost w-full text-xs font-bold" onClick={translate} disabled={busy || !message.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4 text-slate-400" />}
          {busy ? 'Translating…' : 'Translate'}
        </button>
        {result && (
          <div className="animate-fade-in-fast rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700 leading-relaxed">{result.translatedText}</div>
              <button 
                onClick={speak} 
                className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-signal-blue hover:bg-slate-200 transition-colors"
                title="Listen to translation"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
            {result.notes && <div className="mt-1 text-[10px] font-bold text-slate-400">{result.notes}</div>}
          </div>
        )}
      </div>
    </Panel>
  );
}

function VolunteerIncidentFeed({ incidents }: { incidents: any[] }) {
  return (
    <Panel className="bg-white">
      <PanelHeader title="Live Reports Feed" icon={<ShieldAlert className="h-4 w-4 text-signal-blue" />} />
      <div className="max-h-96 space-y-3 overflow-y-auto p-4 bg-slate-50/10">
        {incidents.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}>
            No active incidents.
          </EmptyState>
        ) : (
          incidents.map((i) => (
            <div key={i.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded",
                    i.status === 'resolved' ? "bg-slate-100 text-slate-500" :
                    i.priority >= 4 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {i.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{relativeTime(i.createdAt)}</span>
                </div>
                <StatusChip tone={i.status === 'resolved' ? 'green' : 'slate'}>{i.status}</StatusChip>
              </div>
              <p className="text-xs font-semibold text-slate-700">{i.description}</p>
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {i.locationCode}
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function ResourceRequestForm({ matchId, defaultZone }: { matchId: string; defaultZone: string }) {
  const [resourceType, setResourceType] = useState('Extra Security');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId || !defaultZone || !details || submitting) return;
    setSubmitting(true);
    await api.createIncident({
      matchId,
      type: 'maintenance',
      priority: 5,
      locationCode: defaultZone,
      description: `RESOURCE REQUEST: ${resourceType}. Details: ${details}`,
    });
    setSubmitting(false);
    setSent(true);
    setDetails('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <Panel className="bg-white">
      <PanelHeader title="Request Resource" icon={<Users className="h-4 w-4 text-signal-blue" />} />
      <div className="p-4 bg-slate-50/10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Resource Needed</label>
              <select className="input text-xs font-semibold py-1.5" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                {['Extra Security', 'Medical Staff', 'Wheelchair', 'More Volunteers', 'Maintenance Crew', 'Cleaning Staff'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input text-xs font-semibold bg-slate-100" value={defaultZone || 'Not Assigned'} disabled />
            </div>
          </div>
          <div>
            <label className="label">Additional Details</label>
            <input 
              className="input text-xs font-semibold" 
              placeholder="E.g. Need a wheelchair at Gate 4 entrance quickly" 
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
              required
            />
          </div>
          <button type="submit" disabled={submitting || !details} className="btn-primary w-full text-xs py-2 mt-2 font-bold">
            {submitting ? 'Requesting...' : sent ? 'Request Sent!' : 'Request Resource'}
          </button>
        </form>
      </div>
    </Panel>
  );
}
