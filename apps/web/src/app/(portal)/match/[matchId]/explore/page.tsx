'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { MatchWithStadium, StadiumZone } from '@stadiummind/shared';
import { api } from '@/lib/api';
import { formatKickoff, loadLabel, cn } from '@/lib/utils';
import { Panel, PanelHeader, Spinner, StatusChip } from '@/components/ui';
import { StadiumMap, zoneIconFor } from '@/components/StadiumMap';
import { FanChat } from '@/components/FanChat';
import { ArrowLeft, Compass, Ticket, MapPin } from 'lucide-react';

export default function ExplorePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchWithStadium | null>(null);
  const [zones, setZones] = useState<StadiumZone[]>([]);
  const [selected, setSelected] = useState<StadiumZone | null>(null);

  useEffect(() => {
    api.getMatch(matchId).then((r) => {
      setMatch(r.match);
      setZones(r.zones);
    });
  }, [matchId]);

  return (
    <>
      <div className="max-w-6xl mx-auto w-full">


        {match && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
                Explore without a ticket
              </p>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                <Compass className="h-6 w-6 text-blue-500" /> {match.stadium.name}
              </h1>
              <div className="mt-1 text-sm text-slate-500">
                {match.homeTeam} vs {match.awayTeam} · {formatKickoff(match.kickoffAt)}
              </div>
            </div>
            <Link href={`/match/${matchId}/ticket`} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <Ticket className="h-4 w-4" /> I have a ticket
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Panel>
              <PanelHeader title="Stadium map" />
              <div className="p-4">
                {zones.length > 0 ? (
                  <StadiumMap zones={zones} onZoneClick={setSelected} highlightCodes={selected ? [selected.code] : []} />
                ) : (
                  <div className="flex h-48 items-center justify-center">
                    <Spinner label="Loading map…" />
                  </div>
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Facilities & zones" action={<StatusChip tone="slate">{zones.length} zones</StatusChip>} />
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {zones.map((z) => {
                  const Icon = zoneIconFor(z.zoneType);
                  const tone = z.load === 'red' ? 'red' : z.load === 'yellow' ? 'yellow' : 'green';
                  const active = selected?.code === z.code;
                  return (
                    <button
                      key={z.code}
                      onClick={() => setSelected(z)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all',
                        active
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50'
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700 font-medium">
                        <Icon className="h-4 w-4 shrink-0 text-slate-400" /> <span className="truncate">{z.name}</span>
                      </span>
                      <StatusChip tone={tone}>{loadLabel[z.load]}</StatusChip>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            {selected ? (
              <Panel className="animate-fade-in-fast">
                <PanelHeader title={selected.name} icon={<MapPin className="h-4 w-4 text-blue-500" />} />
                <div className="space-y-3 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {selected.zoneType.replace('_', ' ')}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Current occupancy</span>
                      <span className="font-bold text-slate-700">
                        {selected.occupancy}% · {loadLabel[selected.load]}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${selected.occupancy}%`,
                          background: selected.load === 'red' ? '#ef4444' : selected.load === 'yellow' ? '#eab308' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <span className="text-slate-500">Accessibility score</span>
                    <span className="font-bold text-slate-800">{selected.accessibilityScore}/100</span>
                  </div>
                  {selected.capacity && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                      <span className="text-slate-500">Capacity</span>
                      <span className="font-bold text-slate-800">{selected.capacity.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <span className="text-slate-500">Floor</span>
                    <span className="ml-2 font-bold text-slate-800">Level {selected.floor}</span>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Tap a zone on the map or list to see live occupancy and accessibility info.
                  </p>
                </div>
              </Panel>
            )}
            <FanChat matchId={matchId} />
          </div>
        </div>
      </div>
    </>
  );
}
