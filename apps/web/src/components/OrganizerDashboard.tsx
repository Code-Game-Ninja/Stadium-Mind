'use client';

import toast from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import type { DashboardSnapshot, MatchWithStadium } from '@stadiummind/shared';
import { api } from '@/lib/api';
import { useMatchSnapshot } from '@/lib/useSocket';
import { useGsapReveal } from '@/lib/useGsap';
import { healthTone, relativeTime, minutesToKickoff, cn } from '@/lib/utils';
import { Panel, PanelHeader, StatusChip, Spinner, EmptyState, MetricTile, LivePulse } from '@/components/ui';
import { StadiumMap } from '@/components/StadiumMap';
import { RecommendationCard } from '@/components/RecommendationCard';
import { SimulationControls, WhatIfPanel, ReportsPanel } from '@/components/OrganizerTools';
import { MerchandiseManager } from '@/components/MerchandiseManager';
import { VolunteerManager } from '@/components/VolunteerManager';
import { MatchProposalPanel } from '@/components/dashboard/MatchProposalPanel';
import {
  VisitsHeroCard,
  PopularityGaugeCard,
  TopPerformersCard,
  TargetingRegionCard,
} from '@/components/dashboard/PremiumCards';
import { LiveMatchController } from '@/components/dashboard/LiveMatchController';
import {
  Activity,
  Users,
  TrainFront,
  Leaf,
  ShieldAlert,
  Sparkles,
  History,
  Clock,
  Bell,
  Cpu,
  CloudRain,
  Sun,
  CloudLightning,
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  Zap,
  Loader2,
  ShoppingBag,
  UserCircle2,
  Map,
  FileText,
} from 'lucide-react';
import { LogoutButton } from '@/components/LoginGate';
import { CalendarDays } from 'lucide-react';

export function OrganizerDashboard({ 
  matchId,
  matches,
  setMatchId,
  email,
  onLogout
}: { 
  matchId: string;
  matches: MatchWithStadium[];
  setMatchId: (id: string) => void;
  email: string;
  onLogout: () => void;
}) {
  const { snapshot: liveSnapshot, setSnapshot, connected } = useMatchSnapshot(matchId);
  const [snapshot, setLocal] = useState<DashboardSnapshot | null>(null);
  const [busyRec, setBusyRec] = useState(false);
  const [busyInc, setBusyInc] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'recs' | 'incidents' | 'simulation' | 'merch' | 'volunteers' | 'fans' | 'match_data' | 'proposals'>('overview');
  const [simulatedOverrides, setSimulatedOverrides] = useState<{code: string; occupancy: number}[] | null>(null);
  const prevHealth = useRef<number | null>(null);
  const reveal = useGsapReveal<HTMLDivElement>([Boolean(snapshot), matchId]);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(e.clientX, 600));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    api.getDashboard(matchId).then((r) => setLocal(r.snapshot)).catch(() => {});
  }, [matchId]);
  
  useEffect(() => {
    if (liveSnapshot) setLocal(liveSnapshot);
  }, [liveSnapshot]);

  useEffect(() => {
    if (!snapshot) return;
    const changed = prevHealth.current !== null && prevHealth.current !== snapshot.healthScore;
    prevHealth.current = snapshot.healthScore;
    if (changed) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [snapshot?.healthScore]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!snapshot) {
    return (
      <div className="py-16 flex-1 flex items-center justify-center">
        <Spinner label="Loading command center…" />
      </div>
    );
  }

  async function applyRec(id: string) {
    setBusyRec(true);
    try {
      const r = await api.applyRecommendation(id);
      setLocal(r.snapshot);
      setSnapshot(r.snapshot);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyRec(false);
    }
  }

  async function dismissRec(id: string) {
    setBusyRec(true);
    try {
      const r = await api.dismissRecommendation(id);
      setLocal(r.snapshot);
      setSnapshot(r.snapshot);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyRec(false);
    }
  }

  async function resolveInc(id: string) {
    setBusyInc(id);
    try {
      const r = await api.resolveIncident(id);
      setLocal(r.snapshot);
      setSnapshot(r.snapshot);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyInc(null);
    }
  }

  async function assignInc(id: string, volunteerId: string) {
    setBusyInc(id);
    try {
      const r = await api.assignIncident(id, volunteerId);
      setLocal(r.snapshot);
      setSnapshot(r.snapshot);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyInc(null);
    }
  }

  const tone = healthTone(snapshot.healthScore);
  const pending = snapshot.recommendations.filter((r) => r.status === 'pending');
  const openIncidents = snapshot.incidents.filter((i) => i.status !== 'resolved');
  const proactiveAlerts = snapshot.aiSummary.risks;
  const mins = minutesToKickoff(snapshot.match.kickoffAt);
  const WeatherIcon = snapshot.metrics.weather === 'storm' ? CloudLightning : snapshot.metrics.weather === 'rain' ? CloudRain : Sun;

  return (
    <>
      {/* ---------------- SIDEBAR ---------------- */}
      <aside
        className="sticky top-0 h-screen shrink-0 flex-col justify-between border-r border-ink-700 bg-ink shadow-sm flex overflow-y-auto relative"
        style={{ width: sidebarWidth }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-lime/50 active:bg-lime transition-colors z-10"
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        />
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 group mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-ink shadow-sm">
              <div className="grid grid-cols-3 gap-0.5 w-4 h-4">
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink/40 w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
                <div className="rounded-full bg-ink w-1 h-1" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">Stadium<span className="text-lime">Mind</span></span>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
              <CalendarDays className="h-3.5 w-3.5" /> Active Match
            </label>
            <select
              className="w-full rounded-lg border border-ink-600 bg-ink-800 text-white font-medium text-xs py-2 px-3 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id} className="bg-ink-800 text-white">
                  {m.homeTeam} vs {m.awayTeam}
                </option>
              ))}
            </select>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { key: 'overview', label: 'Overview', icon: LayoutDashboard },
              { key: 'match_data', label: 'Match Data', icon: Activity },
              { key: 'recs', label: 'AI Recommendations', icon: Sparkles, badge: pending.length, badgeTone: 'blue' },
              { key: 'incidents', label: 'Incidents & Reports', icon: ShieldAlert, badge: openIncidents.length, badgeTone: 'red' },
              { key: 'simulation', label: 'Simulation Tools', icon: Zap },
              { key: 'merch', label: 'Merchandise', icon: ShoppingBag },
              { key: 'volunteers', label: 'Volunteers', icon: UserCircle2 },
              { key: 'fans', label: 'Active Fans', icon: Users },
              { key: 'proposals', label: 'Match Proposals', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-lime text-ink"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-extrabold",
                      active
                        ? "bg-ink text-lime"
                        : tab.badgeTone === 'red'
                        ? "bg-red-500 text-white"
                        : "bg-lime text-ink"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-ink-700 p-4 bg-ink-800/50 mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-9 w-9 overflow-hidden rounded-full border border-ink-600 shadow-sm shrink-0 bg-lime flex items-center justify-center text-ink">
                <UserCircle2 className="h-full w-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate w-32">{email}</span>
                <span className="text-[10px] font-semibold uppercase text-white/40">Admin</span>
              </div>
            </div>

            <LogoutButton onLogout={onLogout} label="Sign Out" />
          </div>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <div className="flex-1 min-w-0">
        <div ref={reveal} className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {/* Ops status bar */}
          <div data-animate className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="section-eyebrow mb-1">Operations command center</div>
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
                {snapshot.match.homeTeam} vs {snapshot.match.awayTeam}
              </h1>
              <div className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                {snapshot.match.stadium.name} · {snapshot.match.stadium.hostCity}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <StatusChip tone="slate">
                <Clock className="h-3 w-3" /> {mins > 0 ? `T-${mins} min` : 'Kickoff'}
              </StatusChip>
              <StatusChip
                tone={snapshot.metrics.weather === 'clear' ? 'green' : 'yellow'}
                title={snapshot.weatherInfo?.description}
              >
                <WeatherIcon className="h-3 w-3" /> {snapshot.metrics.weather}
                {snapshot.weatherInfo?.tempC !== undefined && ` · ${snapshot.weatherInfo.tempC}°C`}
                {snapshot.weatherInfo && (snapshot.weatherInfo.source === 'live' ? ' · live' : ' · sim')}
              </StatusChip>
              <StatusChip tone={snapshot.aiSummary.fallbackUsed ? 'amber' : 'green'}>
                <Cpu className="h-3 w-3" /> {snapshot.aiSummary.fallbackUsed ? 'Fallback AI' : 'Gemini'}
              </StatusChip>
              {connected ? (
                <span className="chip border-lime-600/40 bg-lime/20 text-ink">
                  <LivePulse label="Live" />
                </span>
              ) : (
                <StatusChip tone="yellow">Reconnecting…</StatusChip>
              )}
            </div>
          </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Match Configuration */}
          <Panel className="bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Match Overview</h3>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Time</label>
                  <div className="text-sm font-semibold text-slate-800">{new Date(snapshot.match.kickoffAt).toLocaleString()}</div>
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Home Team</label>
                  <div className="text-sm font-semibold text-slate-800">{snapshot.match.homeTeam}</div>
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Away Team</label>
                  <div className="text-sm font-semibold text-slate-800">{snapshot.match.awayTeam}</div>
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Volunteers Required</label>
                  <div className="text-sm font-semibold text-slate-800">{snapshot.volunteerCapacity} total</div>
               </div>
            </div>
          </Panel>
          {/* Premium hero row: visits + popularity gauge */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <VisitsHeroCard snapshot={snapshot} />
            </div>
            <div className="min-w-0">
              <PopularityGaugeCard snapshot={snapshot} />
            </div>
          </div>

          {/* Health gauge + metrics */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <div className="min-w-0">
              <Panel className={cn('flex flex-col items-center justify-center p-4 bg-white transition-shadow duration-500', flash && 'shadow-glow')}>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Activity className="h-3.5 w-3.5" /> Stadium health
                </div>
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={tone.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - snapshot.healthScore / 100)}
                      className="transition-[stroke-dashoffset] duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-extrabold tabular-nums ${tone.text}`}>{snapshot.healthScore}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${tone.text}`}>{tone.label}</span>
                  </div>
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">out of 100 · updates live</div>
              </Panel>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricTile icon={Users} label="Crowd density" value={`${snapshot.metrics.crowdDensity}%`} tone={snapshot.metrics.crowdDensity >= 85 ? 'red' : snapshot.metrics.crowdDensity >= 70 ? 'yellow' : 'green'} hint="avg zone occupancy" />
                <MetricTile icon={ShieldAlert} label="Open incidents" value={snapshot.metrics.incidentsOpen} tone={snapshot.metrics.incidentsOpen > 0 ? 'red' : 'green'} hint={snapshot.metrics.incidentsOpen > 0 ? 'needs attention' : 'all clear'} />
                <MetricTile icon={Users} label="Volunteers" value={`${snapshot.metrics.volunteersActive}/${snapshot.metrics.volunteersTotal}`} tone="blue" hint="active / total" />
                <MetricTile icon={TrainFront} label="Parking" value={`${snapshot.transport.parkingUtilization}%`} tone={snapshot.transport.parkingUtilization >= 90 ? 'red' : snapshot.transport.parkingUtilization >= 80 ? 'yellow' : 'green'} hint="utilization" />
                <MetricTile icon={TrainFront} label="Metro" value={snapshot.transport.metroStatus} tone={snapshot.transport.metroStatus === 'normal' ? 'green' : 'yellow'} hint={`bus +${snapshot.transport.busDelayMinutes}m`} />
                <MetricTile icon={Leaf} label="Food waste" value={`${snapshot.sustainability.foodWasteKg} kg`} tone="green" hint={`${snapshot.sustainability.waterLiters.toLocaleString()} L water`} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <Panel className="bg-white">
                <PanelHeader
                  title="AI executive summary"
                  icon={<Sparkles className="h-4 w-4 text-ink" />}
                  action={
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto
                      </span>
                      <StatusChip tone={snapshot.aiSummary.fallbackUsed ? 'amber' : 'green'}>{snapshot.aiSummary.fallbackUsed ? 'Offline AI' : 'Gemini'}</StatusChip>
                    </div>
                  }
                />
                <div className="p-4 text-xs font-semibold leading-relaxed text-slate-600">{snapshot.aiSummary.summary}</div>
              </Panel>
            </div>

            <div className="min-w-0">
              <Panel className="bg-white">
                <PanelHeader
                  title="Proactive AI alerts"
                  icon={<Bell className="h-4 w-4 text-signal-amber" />}
                  action={<StatusChip tone="amber">{proactiveAlerts.length} signals</StatusChip>}
                />
                <div className="max-h-44 space-y-2 overflow-y-auto p-4 bg-slate-50/20">
                  {proactiveAlerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" /> {a}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI RECOMMENDATIONS */}
      {activeTab === 'recs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div className="min-w-0 space-y-6">
              <WhatIfPanel matchId={matchId} onSimulatedZones={setSimulatedOverrides} />
              
              {simulatedOverrides && (
                <Panel className="bg-white overflow-hidden border-signal-blue/50 ring-2 ring-signal-blue/20">
                  <PanelHeader 
                    title="Simulated Projection Map" 
                    icon={<Map className="h-4 w-4 text-signal-blue" />} 
                    action={<StatusChip tone="slate">What-If Mode</StatusChip>}
                  />
                  <div className="p-4 bg-slate-50/50">
                    <StadiumMap 
                      zones={snapshot.zones.map(z => {
                        const override = simulatedOverrides.find(o => o.code === z.code);
                        return override ? { ...z, occupancy: override.occupancy } : z;
                      })} 
                      highlightCodes={simulatedOverrides.map(o => o.code)} 
                    />
                  </div>
                </Panel>
              )}
              
              <Panel className="bg-white">
                <PanelHeader title="Action history" icon={<History className="h-4 w-4 text-slate-400" />} />
                <div className="max-h-[340px] space-y-2 overflow-y-auto p-4 bg-slate-50/10">
                  {snapshot.actionHistory.length === 0 && <EmptyState icon={<Inbox className="h-5 w-5" />}>No actions taken yet.</EmptyState>}
                  {snapshot.actionHistory.map((a) => (
                    <div key={a.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-slate-800">{a.actionLabel}</div>
                        {a.outcomeSummary && <div className="truncate text-[10px] font-semibold text-slate-400">{a.outcomeSummary}</div>}
                      </div>
                      <StatusChip tone={a.status === 'applied' ? 'green' : 'slate'}>{a.status}</StatusChip>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="min-w-0">
              <Panel className="bg-white">
                <PanelHeader
                  title="AI recommendations"
                  icon={<Sparkles className="h-4 w-4 text-ink" />}
                  action={<StatusChip tone={pending.length ? 'blue' : 'green'}>{pending.length} pending</StatusChip>}
                />
                <div className="max-h-[520px] space-y-3 overflow-y-auto p-4 bg-slate-50/20">
                  {pending.length === 0 && (
                    <EmptyState icon={<CheckCircle2 className="h-6 w-6 text-lime-700" />}>
                      No pending recommendations. Trigger a simulation to generate one.
                    </EmptyState>
                  )}
                  {pending.map((r) => (
                    <RecommendationCard key={r.id} rec={r} onApply={applyRec} onDismiss={dismissRec} busy={busyRec} />
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INCIDENTS & REPORTS */}
      {activeTab === 'incidents' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
              {/* Dedicated Incidents Control Board */}
              <Panel className="bg-white">
                <PanelHeader
                  title="Active Incidents Control Board"
                  subtitle="Live reports from field staff and volunteers"
                  icon={<ShieldAlert className="h-4 w-4 text-red-600 animate-pulse" />}
                  action={<StatusChip tone={openIncidents.length > 0 ? 'red' : 'green'}>{openIncidents.length} active</StatusChip>}
                />
                <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto bg-slate-50/15">
                  {openIncidents.length === 0 ? (
                    <EmptyState icon={<Inbox className="h-8 w-8 text-slate-300" />}>
                      No active incidents.
                    </EmptyState>
                  ) : (
                    openIncidents.map((i) => {
                      const isResolved = i.status === 'resolved';
                      const isHighPriority = i.priority >= 4;
                      const assignedVolunteer = i.assignedVolunteerId
                        ? snapshot.volunteers.find((v) => v.id === i.assignedVolunteerId)
                        : undefined;
                      const availableVolunteers = snapshot.volunteers.filter(
                        (v) => v.applicationStatus === 'approved' && v.status === 'available'
                      );
                      return (
                        <div
                          key={i.id}
                          className={cn(
                            "rounded-xl border p-4 transition-all bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
                            isResolved
                              ? "border-slate-200 opacity-60"
                              : isHighPriority
                              ? "border-red-200 bg-red-50/10 shadow-red-50"
                              : "border-slate-200 bg-white"
                          )}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded",
                                isResolved
                                  ? "bg-slate-100 text-slate-600"
                                  : isHighPriority
                                  ? "bg-red-100 text-red-600 animate-pulse"
                                  : "bg-amber-100 text-amber-600"
                              )}>
                                {i.type.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                Location: <span className="font-mono text-slate-800 font-bold bg-slate-100 px-1 rounded">{i.locationCode}</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {relativeTime(i.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">
                              {i.description}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {isResolved ? (
                              <StatusChip tone="green">Resolved</StatusChip>
                            ) : (
                              <>
                                {assignedVolunteer ? (
                                  <StatusChip tone="blue">{assignedVolunteer.displayName}</StatusChip>
                                ) : (
                                  <select
                                    value=""
                                    disabled={busyInc === i.id || availableVolunteers.length === 0}
                                    onChange={(e) => e.target.value && assignInc(i.id, e.target.value)}
                                    className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 disabled:opacity-50"
                                  >
                                    <option value="">
                                      {availableVolunteers.length === 0 ? 'No volunteers free' : 'Assign volunteer…'}
                                    </option>
                                    {availableVolunteers.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {v.displayName}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  onClick={() => resolveInc(i.id)}
                                  disabled={busyInc === i.id}
                                  className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
                                >
                                  {busyInc === i.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                  Resolve
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Panel>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  <TopPerformersCard snapshot={snapshot} />
                </div>
                <div className="min-w-0">
                  <TargetingRegionCard snapshot={snapshot} />
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-6">
              <ReportsPanel matchId={matchId} />

              <Panel className="bg-white">
                <PanelHeader title="AI incident timeline" icon={<Clock className="h-4 w-4 text-slate-400" />} />
                <div className="max-h-80 space-y-3 overflow-y-auto p-4 bg-slate-50/10">
                  {snapshot.timeline.length === 0 && <EmptyState icon={<Inbox className="h-5 w-5" />}>No events yet.</EmptyState>}
                  {snapshot.timeline.map((t) => (
                    <div key={t.id} className="relative border-l-2 border-slate-200 pl-3">
                      <span
                        className={cn(
                          'absolute -left-[5px] top-1.5 h-2 w-2 rounded-full',
                          t.severity >= 4 ? 'bg-signal-red' : t.severity >= 3 ? 'bg-signal-amber' : 'bg-pitch-500'
                        )}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{t.label}</span>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">{relativeTime(t.createdAt)}</span>
                      </div>
                      {t.detail && <div className="text-[11px] font-semibold text-slate-400">{t.detail}</div>}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULATION TOOLS */}
      {activeTab === 'simulation' && (
        <div className="space-y-6 animate-fade-in">
          <SimulationControls matchId={matchId} />
        </div>
      )}

      {/* TAB 6: MERCHANDISE */}
      {activeTab === 'merch' && (
        <div className="space-y-6 animate-fade-in max-w-5xl">
          <MerchandiseManager matchId={matchId} />
        </div>
      )}

      {/* TAB 7: VOLUNTEERS */}
      {activeTab === 'volunteers' && (
        <div className="space-y-6 animate-fade-in">
          <VolunteerManager matchId={matchId} />
        </div>
      )}

      {/* TAB 8: ACTIVE FANS */}
      {activeTab === 'fans' && (
        <div className="space-y-6 animate-fade-in">
          <Panel className="bg-white">
            <PanelHeader title="Active Fan Guests" icon={<Users className="h-4 w-4 text-ink" />} action={<StatusChip tone="green">{snapshot.activeGuests?.length || 0} active</StatusChip>} />
            <div className="p-4">
              {(!snapshot.activeGuests || snapshot.activeGuests.length === 0) ? (
                <EmptyState icon={<UserCircle2 className="h-8 w-8 text-slate-300" />}>
                  No fans are currently logged in with a digital ticket.
                </EmptyState>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {snapshot.activeGuests.map((g) => (
                    <div key={g.ticketId} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{g.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{relativeTime(g.activeAt)}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        Ticket: <span className="font-mono text-slate-700">{g.ticketId}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        Location: <span className="text-slate-700">{g.seatLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 9: MATCH DATA */}
      {activeTab === 'match_data' && (
        <div className="space-y-6 animate-fade-in max-w-5xl">
          <LiveMatchController matchId={matchId} />
        </div>
      )}

      {/* TAB 10: PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-6 animate-fade-in max-w-5xl">
          <MatchProposalPanel />
        </div>
      )}
        </div>
      </div>
    </>
  );
}
