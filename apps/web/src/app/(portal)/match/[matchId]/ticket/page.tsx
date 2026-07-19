'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MatchWithStadium, TicketVerifyResult } from '@stadiummind/shared';
import { api } from '@/lib/api';
import { formatKickoff } from '@/lib/utils';
import { Panel, PanelHeader, StatusChip } from '@/components/ui';
import {
  Ticket,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ScanLine,
  ShieldCheck,
  Compass,
  Loader2,
  MapPin,
  Armchair,
  DoorOpen,
} from 'lucide-react';

export default function TicketPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchWithStadium | null>(null);
  const [ticketId, setTicketId] = useState('');
  const [qrText, setQrText] = useState('');
  const [result, setResult] = useState<TicketVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tab, setTab] = useState<'id' | 'qr'>('id');
  const [demoTicketIds, setDemoTicketIds] = useState<string[]>([]);

  useEffect(() => {
    api.getMatch(matchId).then((r) => setMatch(r.match)).catch(() => setMatch(null));
    api.getConfig().then((r) => setDemoTicketIds(r.ticketIds)).catch(() => setDemoTicketIds([]));
  }, [matchId]);

  async function verifyById(id: string) {
    setVerifying(true);
    setResult(null);
    try {
      const r = await api.verifyTicket({ ticketId: id.trim(), matchId });
      setResult(r);
    } catch (e) {
      setResult({ valid: false, reason: 'not_found', message: (e as Error).message });
    } finally {
      setVerifying(false);
    }
  }

  async function verifyByQr() {
    setVerifying(true);
    setResult(null);
    try {
      const payload = JSON.parse(qrText);
      const r = await api.verifyTicket({ ticketId: payload.ticket_id, matchId, qrPayload: payload });
      setResult(r);
    } catch {
      setResult({
        valid: false,
        reason: 'not_found',
        message:
          'Could not decode QR payload. Expected JSON like {"ticket_id":"WC2026-453621","match_code":"NYJ-FRA-ESP-2026"}.',
      });
      setVerifying(false);
      return;
    }
    setVerifying(false);
  }

  function loadSampleQr(id: string) {
    const code = match?.code || '';
    setQrText(JSON.stringify({ ticket_id: id, match_code: code }, null, 2));
  }

  return (
    <>
      <div className="max-w-4xl mx-auto w-full">

      {/* Match summary header */}
      {match && (
        <Panel className="mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <TeamMark name={match.homeTeam} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">vs</span>
              <TeamMark name={match.awayTeam} />
            </div>
            <div className="min-w-0 sm:text-right">
              <div className="flex items-center gap-1.5 text-sm text-slate-600 sm:justify-end">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">
                  {match.stadium.name} · {match.stadium.hostCity}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-400">{formatKickoff(match.kickoffAt)}</div>
              <div className="mt-2 sm:flex sm:justify-end">
                <StatusChip tone="slate">{match.stage}</StatusChip>
              </div>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Verification panel */}
        <Panel>
          <PanelHeader
            title="Verify your ticket"
            icon={<ShieldCheck className="h-4 w-4 text-pitch-400" />}
            action={<StatusChip tone="green">Secure demo check</StatusChip>}
          />
          <div className="p-5">
            {/* Tabs */}
            <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                className={tabBtn(tab === 'id')}
                onClick={() => setTab('id')}
              >
                <Ticket className="h-4 w-4" /> Ticket ID
              </button>
              <button
                className={tabBtn(tab === 'qr')}
                onClick={() => setTab('qr')}
              >
                <QrCode className="h-4 w-4" /> QR payload
              </button>
            </div>

            {tab === 'id' ? (
              <div>
                <label className="label">Ticket ID</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="input font-mono"
                    placeholder="WC2026-453621"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && ticketId && verifyById(ticketId)}
                  />
                  <button
                    className="btn-primary shrink-0"
                    disabled={!ticketId || verifying}
                    onClick={() => verifyById(ticketId)}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                      </>
                    ) : (
                      'Verify ticket'
                    )}
                  </button>
                </div>
                <SampleRow label="Try a demo ticket:" ids={demoTicketIds} onPick={(id) => { setTicketId(id); verifyById(id); }} />
              </div>
            ) : (
              <div>
                <label className="label">QR payload (JSON)</label>
                <textarea
                  className="input h-28 font-mono text-xs"
                  placeholder='{"ticket_id":"WC2026-453621","match_code":"NYJ-FRA-ESP-2026"}'
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                />
                <div className="mt-3">
                  <button className="btn-primary" disabled={!qrText || verifying} onClick={verifyByQr}>
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                    Decode &amp; verify
                  </button>
                </div>
                <SampleRow label="Load a sample QR:" ids={demoTicketIds} onPick={loadSampleQr} />
              </div>
            )}

            {result && <ResultBlock result={result} matchId={matchId} router={router} />}

            <p className="mt-5 flex items-start gap-2 border-t border-base-700/70 pt-4 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Tickets are checked against a demo ticket database, not a live FIFA system. A ticket for another match is
              rejected with a clear mismatch message.
            </p>
          </div>
        </Panel>

        {/* Side rail */}
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
              <QrCode className="h-4 w-4 text-pitch-400" /> How it works
            </div>
            <ol className="space-y-2.5 text-sm text-slate-400">
              {['Enter a ticket ID or paste a QR payload.', 'We match it to this exact match.', 'Unlock your personalized match-day journey.'].map(
                (step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-base-800 text-[11px] font-bold text-slate-300">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                )
              )}
            </ol>
          </Panel>

          <Link
            href={`/match/${matchId}/explore`}
            className="panel card-hover flex items-center justify-between p-4 text-sm text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-slate-400" /> Explore without a ticket
            </span>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </Link>
        </div>
        </div>
      </div>
    </>
  );
}

function tabBtn(active: boolean) {
  return `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    active ? 'bg-base-750 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
  }`;
}

function SampleRow({ label, ids, onPick }: { label: string; ids: string[]; onPick: (id: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      {ids.map((id) => (
        <button
          key={id}
          className="chip border-base-600 bg-base-800 font-mono text-slate-300 transition-colors hover:border-pitch-500/40 hover:text-pitch-400"
          onClick={() => onPick(id)}
        >
          {id}
        </button>
      ))}
    </div>
  );
}

function ResultBlock({
  result,
  matchId,
  router,
}: {
  result: TicketVerifyResult;
  matchId: string;
  router: ReturnType<typeof useRouter>;
}) {
  if (result.valid && result.ticket) {
    return (
      <div className="mt-5 animate-scale-in rounded-xl border border-pitch-500/40 bg-pitch-500/[0.08] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pitch-400" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-pitch-400">Ticket verified</div>
            <p className="mt-1 text-sm text-slate-300">{result.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip tone="slate">
                <Armchair className="h-3 w-3" /> Seat {result.ticket.seatLabel}
              </StatusChip>
              <StatusChip tone="slate">Section {result.ticket.sectionCode}</StatusChip>
              <StatusChip tone="green">
                <DoorOpen className="h-3 w-3" /> Gate {result.ticket.recommendedGateCode}
              </StatusChip>
            </div>
            <button
              className="btn-primary mt-4"
              onClick={() =>
                router.push(`/match/${matchId}/journey?ticket=${encodeURIComponent(result.ticket!.ticketId)}`)
              }
            >
              Plan my match day <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mismatch = result.reason === 'match_mismatch';
  return (
    <div
      className={`mt-5 animate-scale-in rounded-xl border p-4 ${
        mismatch ? 'border-signal-amber/40 bg-signal-amber/[0.08]' : 'border-signal-red/40 bg-signal-red/[0.08]'
      }`}
    >
      <div className="flex items-start gap-3">
        {mismatch ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-signal-amber" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-signal-red" />
        )}
        <div className="flex-1">
          <div className={`text-sm font-semibold ${mismatch ? 'text-signal-amber' : 'text-signal-red'}`}>
            {mismatch ? 'Wrong match for this ticket' : 'Not verified'}
          </div>
          <p className="mt-1 text-sm text-slate-600">{result.message}</p>
          {mismatch && (
            <Link
              href="/#match-hub"
              className="btn-ghost mt-4"
            >
              Choose the correct match <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamMark({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <span className="font-bold text-slate-800">{name}</span>
    </div>
  );
}
