'use client';

import type { DashboardSnapshot } from '@stadiummind/shared';
import { useCountUp } from '@/lib/useGsap';
import { cn } from '@/lib/utils';
import {
  Star,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Play,
  Gauge as GaugeIcon,
  Users,
  MapPin,
  Activity,
} from 'lucide-react';

/* ---------------- derived metrics ---------------- */
export function derive(snapshot: DashboardSnapshot) {
  const capacity = snapshot.match.stadium.capacity;
  const attendance = Math.round((capacity * snapshot.metrics.crowdDensity) / 100);
  const generalRate = (snapshot.healthScore / 20).toFixed(1);
  return { attendance, generalRate, popularity: snapshot.healthScore };
}

/* ---------------- Visits / attendance hero ---------------- */
export function VisitsHeroCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const d = derive(snapshot);
  const attendance = useCountUp(d.attendance, { duration: 1.4 });

  return (
    <div
      data-animate
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#3f8f9e] via-[#4899a8] to-[#e2b49a] p-6 text-white shadow-panel"
    >
      {/* subtle ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-white/90">Visits for today</div>
          <div className="mt-2 text-5xl font-extrabold leading-none tracking-tight tabular-nums sm:text-6xl">{attendance}</div>

          <div className="mt-6 flex flex-wrap gap-3">
            <HeroStat icon={Star} label="Popularity" value={String(d.popularity)} />
            <HeroStat icon={TrendingUp} label="General rate" value={`${d.generalRate}`} />
          </div>
        </div>

        {/* Customized illustration from the reference design image */}
        <div className="relative hidden w-44 shrink-0 sm:block h-32">
          <svg viewBox="0 0 160 140" className="h-full w-full filter drop-shadow-sm">
            {/* Background elements */}
            <circle cx="100" cy="85" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="0" y1="125" x2="160" y2="125" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            
            {/* Table & Plant */}
            <path d="M 28 90 L 48 90 M 38 90 L 38 125 M 32 125 L 44 125" stroke="#2c3b46" strokeWidth="2" strokeLinecap="round" />
            <path d="M 33 90 L 43 90 L 41 80 L 35 80 Z" fill="#e2b49a" stroke="#2c3b46" strokeWidth="1.5" />
            <path d="M 38 80 Q 35 65, 30 68 Q 38 75, 38 80 M 38 80 Q 42 62, 47 66 Q 41 75, 38 80" fill="#3f8f9e" stroke="#2c3b46" strokeWidth="1.2" />

            {/* Armchair legs */}
            <path d="M 85 98 L 78 125 M 115 98 L 122 125" stroke="#2c3b46" strokeWidth="2" strokeLinecap="round" />
            
            {/* Armchair cushion */}
            <path d="M 72 88 C 72 70, 78 58, 102 58 C 122 58, 128 70, 128 88 C 128 96, 120 98, 100 98 C 80 98, 72 96, 72 88 Z" fill="#ffffff" stroke="#2c3b46" strokeWidth="2" />
            
            {/* Person Legs */}
            <path d="M 85 88 Q 95 106, 112 106" fill="none" stroke="#2c3b46" strokeWidth="3" strokeLinecap="round" />
            <path d="M 85 88 Q 90 102, 85 118" fill="none" stroke="#2c3b46" strokeWidth="3" strokeLinecap="round" />
            
            {/* Torso */}
            <path d="M 106 88 L 106 68" stroke="#2c3b46" strokeWidth="4.5" strokeLinecap="round" />
            
            {/* Head */}
            <circle cx="106" cy="53" r="7" fill="#fceada" stroke="#2c3b46" strokeWidth="2" />
            <path d="M 101 50 Q 106 43, 111 48 Q 107 53, 101 50" fill="#2c3b46" />

            {/* Arms & Laptop */}
            <path d="M 106 72 L 95 82 L 87 75" fill="none" stroke="#2c3b46" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 87 75 L 72 75 L 82 85" fill="none" stroke="#2c3b46" strokeWidth="2" strokeLinecap="round" />
            <path d="M 72 75 L 79 66" fill="none" stroke="#2c3b46" strokeWidth="2" strokeLinecap="round" />

            {/* Floating orbital and stats */}
            <circle cx="95" cy="30" r="4.5" fill="#ffffff" opacity="0.9" />
            <circle cx="95" cy="30" r="10" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="86" cy="27" r="2" fill="#2c3b46" />
          </svg>
        </div>
      </div>

      <a
        href="#ops-tools"
        className="relative z-10 mt-6 inline-flex items-center gap-2 rounded-xl bg-[#245862]/80 hover:bg-[#1a434b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md backdrop-blur transition-transform active:scale-95"
      >
        VIEW FULL STATISTIC <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[#1e4850]/30 border border-white/10 px-3 py-1.5 backdrop-blur">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-bold text-white/80 uppercase tracking-wide">{label}</div>
        <div className="text-sm font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

/* ---------------- Popularity gauge (peach/coral card) ---------------- */
export function PopularityGaugeCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const value = snapshot.healthScore;
  const shown = useCountUp(value, { duration: 1.3 });
  const tone = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';
  const toneLabel = value >= 80 ? 'Healthy' : value >= 60 ? 'Watch' : 'Critical';
  const message =
    value >= 80
      ? 'Operations are running smoothly. Keep applying AI recommendations to stay ahead.'
      : value >= 60
      ? 'A few signals need attention. Review proactive alerts and apply recommendations.'
      : 'Critical load detected. Act on the top recommendations to recover the score.';

  return (
    <div data-animate className="flex flex-col rounded-[24px] bg-[#fceada] border border-[#f5d6bb] p-6 text-[#2d1502] shadow-panel">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7c583c]">
        <GaugeIcon className="h-4 w-4 text-[#e07a3f]" /> Popularity rate
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-extrabold leading-none tracking-tight tabular-nums">{shown}</span>
          <span
            className="mb-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
            style={{ background: tone }}
          >
            {toneLabel}
          </span>
        </div>
        <SemiGauge value={value} color="#e07a3f" />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#7c583c] font-medium">{message}</p>

      <a
        href="#ops-tools"
        className="mt-4 flex items-center justify-between rounded-xl bg-white border border-[#e07a3f]/10 px-3 py-2 text-xs font-bold text-[#3a2a20] transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#e07a3f]" />
          Learn insights how to manage all aspects
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e07a3f] text-white">
          <Play className="h-3 w-3 fill-white" />
        </span>
      </a>
    </div>
  );
}

function SemiGauge({ value, color }: { value: number; color: string }) {
  const size = 96;
  const cx = size / 2;
  const cy = size / 2;
  const r = 38;
  const clamped = Math.max(0, Math.min(100, value));
  const angle = Math.PI - (clamped / 100) * Math.PI; // 180deg → 0deg
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);

  const arc = (from: number, to: number) => {
    const a0 = Math.PI - (from / 100) * Math.PI;
    const a1 = Math.PI - (to / 100) * Math.PI;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };

  return (
    <svg width={size} height={size / 1.6} viewBox={`0 0 ${size} ${size / 1.6}`}>
      <path d={arc(0, 100)} fill="none" stroke="#fff8f2" strokeWidth={7} strokeLinecap="round" />
      <path d={arc(0, clamped)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#2d1502" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3.5} fill="#2d1502" />
    </svg>
  );
}

/* ---------------- Zone load bars (finance-performance style) ---------------- */
export function ZoneLoadCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const bars = snapshot.zones
    .filter((z) => ['gate', 'section', 'food_court', 'transport', 'parking'].includes(z.zoneType))
    .slice(0, 6)
    .map((z) => ({ label: z.code.replace(/^[A-Z]+-/, ''), code: z.code, value: z.occupancy, load: z.load }));

  return (
    <div data-animate className="panel p-5 bg-white">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Activity className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="text-lg font-extrabold tracking-tight tabular-nums text-slate-800">{snapshot.metrics.crowdDensity}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg zone load</div>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2" style={{ height: 130 }}>
        {bars.map((b, i) => {
          const color = b.load === 'red' ? '#ef4444' : b.load === 'yellow' ? '#f59e0b' : '#3b82f6';
          return (
            <div key={b.code} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex w-full max-w-[24px] flex-1 items-end overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
                <div
                  className="w-full rounded-full transition-[height] duration-700 ease-out"
                  style={{
                    height: `${b.value}%`,
                    background: `linear-gradient(to top, ${color}, ${color}cc)`,
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Top performers (volunteers) ---------------- */
export function TopPerformersCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const statusMap: Record<string, { label: string; dot: string }> = {
    available: { label: 'Online', dot: 'bg-pitch-500' },
    busy: { label: 'Busy', dot: 'bg-signal-amber' },
    break: { label: 'On break', dot: 'bg-slate-450' },
  };
  const performers = snapshot.volunteers.slice(0, 4).map((v, i) => ({
    ...v,
    score: (4.2 + ((i * 17) % 7) / 10).toFixed(1),
  }));

  return (
    <div data-animate className="panel p-5 bg-white">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
        <Users className="h-4 w-4 text-ink" /> TOP performers
      </div>
      <div className="space-y-3">
        {performers.map((p) => {
          const s = statusMap[p.status] || statusMap.available;
          const initials = p.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2);
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{p.displayName}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} /> {s.label}
                </div>
              </div>
              <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold tabular-nums text-orange-700 border border-orange-100">
                {p.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Targeting by region ---------------- */
export function TargetingRegionCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const city = snapshot.match.stadium.hostCity;
  const pct = snapshot.metrics.crowdDensity;
  const rate = (snapshot.healthScore / 20).toFixed(1);

  return (
    <div data-animate className="relative overflow-hidden panel p-5 bg-white">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
        <MapPin className="h-4 w-4 text-signal-blue" /> Targeting by region
      </div>

      {/* Abstract dotted map */}
      <div className="relative h-[130px] w-full rounded-xl border border-slate-100 bg-slate-50/50">
        <svg viewBox="0 0 200 90" className="h-full w-full">
          {Array.from({ length: 11 }).map((_, r) =>
            Array.from({ length: 26 }).map((_, c) => {
              const x = 6 + c * 7.4;
              const y = 6 + r * 7.4;
              // rough continents mask
              const on =
                (y > 20 && y < 60 && ((x > 20 && x < 60) || (x > 80 && x < 120) || (x > 140 && x < 185))) ||
                (y > 55 && y < 80 && ((x > 45 && x < 70) || (x > 95 && x < 120)));
              if (!on) return null;
              return <circle key={`${r}-${c}`} cx={x} cy={y} r={1.1} fill="#cbd5e1" />;
            })
          )}
          {/* highlight dot */}
          <circle cx={96} cy={38} r={4} fill="#3b82f6" opacity={0.35}>
            <animate attributeName="r" values="4;7;4" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={96} cy={38} r={2.4} fill="#3b82f6" />
        </svg>

        <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-center shadow-md">
          <div className="text-xs font-bold text-slate-800">{city}</div>
          <div className="text-[10px] font-bold text-slate-400">
            {pct}% · <span className="text-ink">▲ {rate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
