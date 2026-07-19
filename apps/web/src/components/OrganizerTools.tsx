'use client';
import toast from 'react-hot-toast';

import { useState, useEffect } from 'react';
import {
  SIMULATION_SCENARIOS,
  type SimulationScenario,
  type WhatIfResponse,
  type MatchBriefResponse,
  type EndMatchReportResponse,
} from '@stadiummind/shared';
import { api } from '@/lib/api';
import { Panel, PanelHeader, StatusChip, Spinner } from '@/components/ui';
import {
  Zap,
  Users,
  CloudRain,
  TrainFront,
  HeartPulse,
  ParkingCircle,
  Utensils,
  Baby,
  PlugZap,
  FlaskConical,
  FileText,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

const SCENARIO_ICON: Record<SimulationScenario, typeof Users> = {
  increase_crowd: Users,
  rain_starts: CloudRain,
  metro_delay: TrainFront,
  medical_emergency: HeartPulse,
  parking_full: ParkingCircle,
  food_overload: Utensils,
  lost_child: Baby,
  power_issue: PlugZap,
};

export function SimulationControls({ matchId }: { matchId: string }) {
  const [pending, setPending] = useState<SimulationScenario | null>(null);
  const [lastFired, setLastFired] = useState<string | null>(null);

  async function run(scenario: SimulationScenario) {
    setPending(scenario);
    try {
      await api.simulate(matchId, scenario);
      const label = SIMULATION_SCENARIOS.find((s) => s.key === scenario)?.label ?? scenario;
      setLastFired(label);
      setTimeout(() => setLastFired(null), 3200);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <Panel className="bg-white">
      <PanelHeader
        title="Simulation controls"
        subtitle="Trigger a live scenario — metrics, timeline, and AI recommendations update instantly"
        icon={<Zap className="h-4 w-4 text-signal-amber" />}
        action={
          lastFired ? (
            <StatusChip tone="green">
              <CheckCircle2 className="h-3 w-3" /> {lastFired} applied
            </StatusChip>
          ) : (
            <StatusChip tone="amber">Live demo triggers</StatusChip>
          )
        }
      />
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 bg-slate-50/20">
        {SIMULATION_SCENARIOS.map((s) => {
          const Icon = SCENARIO_ICON[s.key];
          const active = pending === s.key;
          const critical = s.severity >= 4;
          return (
            <button
              key={s.key}
              onClick={() => run(s.key)}
              disabled={pending !== null}
              title={s.description}
              className={`group flex flex-col items-center gap-1.5 rounded-lg border bg-white px-2 py-3 text-center text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 ${
                critical
                  ? 'border-slate-200 hover:border-signal-red/40 hover:bg-red-50/50'
                  : 'border-slate-200 hover:border-signal-amber/40 hover:bg-amber-50/50'
              }`}
            >
              {active ? (
                <Loader2 className="h-5 w-5 animate-spin text-signal-amber" />
              ) : (
                <Icon
                  className={`h-5 w-5 text-slate-400 transition-colors ${
                    critical ? 'group-hover:text-signal-red' : 'group-hover:text-signal-amber'
                  }`}
                />
              )}
              <span className="leading-tight text-[11px]">{s.label}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function WhatIfPanel({ 
  matchId,
  onSimulatedZones
}: { 
  matchId: string;
  onSimulatedZones?: (zones: { code: string; occupancy: number }[] | null) => void;
}) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = ['What if Gate 4 closes?', 'What if rain intensifies before kickoff?', 'What if the metro is delayed 20 min?'];

  async function run(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    onSimulatedZones?.(null);
    try {
      const res = await api.whatIf({ matchId, question: q });
      setResult(res);
      if (res.projectedZones) {
        onSimulatedZones?.(res.projectedZones);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function clearScenario() {
    setQuestion('');
    setResult(null);
    onSimulatedZones?.(null);
  }

  const riskTone = result?.riskLevel === 'high' ? 'red' : result?.riskLevel === 'medium' ? 'yellow' : 'green';

  return (
    <Panel className="bg-white">
      <PanelHeader title="What-if simulator" icon={<FlaskConical className="h-4 w-4 text-signal-blue" />} />
      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <input
            className="input text-xs font-medium"
            placeholder="Ask a scenario question…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(question)}
          />
          <button className="btn-primary shrink-0 text-xs px-4" onClick={() => run(question)} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Analyze
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <button key={ex} onClick={() => { setQuestion(ex); run(ex); }} className="chip border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-signal-blue/40 hover:text-signal-blue">
              {ex}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Spinner label="Running what-if analysis…" />
          </div>
        )}
        {result && (
          <div className="animate-fade-in-fast space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk level</span>
              <StatusChip tone={riskTone as 'red' | 'yellow' | 'green'}>{result.riskLevel}</StatusChip>
              {result.fallbackUsed && <StatusChip tone="slate">Offline AI</StatusChip>}
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-450">Impact</div>
              <ul className="list-disc space-y-0.5 pl-4 text-xs font-semibold text-slate-600">
                {result.impact.map((i, k) => <li key={k}>{i}</li>)}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-450">Mitigations</div>
              <ul className="list-disc space-y-0.5 pl-4 text-xs font-semibold text-slate-600">
                {result.mitigations.map((i, k) => <li key={k}>{i}</li>)}
              </ul>
            </div>
            {result.projectedZones && result.projectedZones.length > 0 && (
              <div className="mt-2 text-xs font-semibold text-signal-blue flex items-center justify-between">
                <span>Map updated with projected zones</span>
                <button onClick={clearScenario} className="btn-ghost text-xs py-1 px-2 border border-slate-200">
                  Clear Scenario
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

export function ReportsPanel({ matchId }: { matchId: string }) {
  const [brief, setBrief] = useState<MatchBriefResponse | null>(null);
  const [endReport, setEndReport] = useState<EndMatchReportResponse | null>(null);
  const [loading, setLoading] = useState<'brief' | 'end' | null>(null);

  async function genBrief() {
    setLoading('brief');
    try { setBrief(await api.matchBrief(matchId)); } catch (e) { toast.error((e as Error).message); } finally { setLoading(null); }
  }
  async function genEnd() {
    setLoading('end');
    try { setEndReport(await api.endMatch(matchId)); } catch (e) { toast.error((e as Error).message); } finally { setLoading(null); }
  }

  return (
    <Panel className="bg-white">
      <PanelHeader title="AI reports" icon={<FileText className="h-4 w-4 text-ink" />} />
      <div className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn-ghost flex-1 text-xs" onClick={genBrief} disabled={loading !== null}>
            {loading === 'brief' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />}
            {loading === 'brief' ? 'Generating…' : 'Match brief'}
          </button>
          <button className="btn-ghost flex-1 text-xs" onClick={genEnd} disabled={loading !== null}>
            {loading === 'end' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-slate-400" />}
            {loading === 'end' ? 'Generating…' : 'End-match report'}
          </button>
        </div>

        {brief && (
          <ReportBlock title="Pre-match brief" text={brief.brief} lists={[['Key risks', brief.keyRisks], ['Recommended setup', brief.recommendedSetup]]} fallback={brief.fallbackUsed} />
        )}
        {endReport && (
          <ReportBlock title="End-match report" text={endReport.report} lists={[['Wins', endReport.wins], ['Improvements', endReport.improvements]]} fallback={endReport.fallbackUsed} />
        )}
      </div>
    </Panel>
  );
}

interface ReportBlockProps {
  title: string;
  text: string;
  lists: [string, string[]][];
  fallback: boolean;
}

function ReportBlock({
  title,
  text,
  lists,
  fallback,
}: ReportBlockProps) {
  return (
    <div className="animate-fade-in-fast rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">{title}</span>
        <StatusChip tone={fallback ? 'amber' : 'green'}>{fallback ? 'Offline AI' : 'Gemini'}</StatusChip>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-600 font-medium">{text}</p>
      {lists.map(([label, items]) => (
        <div key={label} className="mb-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
          <ul className="list-disc space-y-0.5 pl-4 text-xs font-semibold text-slate-600">
            {items.map((i, k) => <li key={k}>{i}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
