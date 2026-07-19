'use client';

import type { StadiumZone } from '@stadiummind/shared';
import { loadColor, loadLabel } from '@/lib/utils';
import {
  DoorOpen,
  Utensils,
  Bath,
  Cross,
  Car,
  TrainFront,
  ShoppingBag,
  Accessibility,
  Armchair,
} from 'lucide-react';

const ZONE_ICON: Record<string, typeof DoorOpen> = {
  gate: DoorOpen,
  food_court: Utensils,
  washroom: Bath,
  medical: Cross,
  parking: Car,
  transport: TrainFront,
  merchandise: ShoppingBag,
  accessibility: Accessibility,
  section: Armchair,
};

export function StadiumMap({
  zones,
  highlightCodes = [],
  routeCodes = [],
  onZoneClick,
  animateRoute = true,
}: {
  zones: StadiumZone[];
  highlightCodes?: string[];
  routeCodes?: string[];
  onZoneClick?: (zone: StadiumZone) => void;
  animateRoute?: boolean;
}) {
  // Build ordered route points from zone positions
  const routeZones = routeCodes
    .map((code) => zones.find((z) => z.code === code))
    .filter(Boolean) as StadiumZone[];

  const routePoints = routeZones.map((z) => `${z.x},${z.y}`).join(' ');

  // Build midpoint arrows along the route segments
  const arrowSegments: { x: number; y: number; angle: number }[] = [];
  for (let i = 0; i < routeZones.length - 1; i++) {
    const a = routeZones[i];
    const b = routeZones[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    arrowSegments.push({ x: mx, y: my, angle });
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-800 to-slate-900 shadow-sm">
      <svg viewBox="0 0 100 90" className="w-full" style={{ aspectRatio: '100 / 90' }}>
        <defs>
          <radialGradient id="pitchGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e4d2b" />
            <stop offset="100%" stopColor="#0d1a12" />
          </radialGradient>
          {/* Arrow marker for route direction */}
          <marker id="routeArrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L0,4 L4,2 z" fill="#60a5fa" opacity="0.9" />
          </marker>
          {/* Glow filter for route */}
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stadium bowl */}
        <ellipse cx="55" cy="48" rx="42" ry="34" fill="#0f1420" stroke="#2d3a55" strokeWidth="0.6" />
        <ellipse cx="55" cy="48" rx="30" ry="22" fill="url(#pitchGlow)" stroke="#1f3a26" strokeWidth="0.5" />

        {/* Pitch markings */}
        <rect x="42" y="38" width="26" height="20" rx="2" fill="#16351f" stroke="#22c55e" strokeWidth="0.4" opacity="0.9" />
        <line x1="55" y1="38" x2="55" y2="58" stroke="#22c55e" strokeWidth="0.3" opacity="0.6" />
        <circle cx="55" cy="48" r="3" fill="none" stroke="#22c55e" strokeWidth="0.3" opacity="0.6" />
        {/* Goal boxes */}
        <rect x="49" y="38" width="12" height="4" rx="0.5" fill="none" stroke="#22c55e" strokeWidth="0.25" opacity="0.5" />
        <rect x="49" y="54" width="12" height="4" rx="0.5" fill="none" stroke="#22c55e" strokeWidth="0.25" opacity="0.5" />

        {/* Route: glow underlay */}
        {routePoints && (
          <>
            {/* Wide glow */}
            <polyline
              points={routePoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.12"
            />
            {/* Main dashed route line */}
            <polyline
              points={routePoints}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animateRoute ? 'route-dash' : ''}
              strokeDasharray="1.5 0.8"
              opacity="0.95"
              filter="url(#routeGlow)"
            />
            {/* Direction arrows at each segment midpoint */}
            {arrowSegments.map((seg, i) => (
              <g key={i} transform={`translate(${seg.x}, ${seg.y}) rotate(${seg.angle})`}>
                {/* Arrow triangle pointing in direction of travel */}
                <polygon
                  points="-1.2,-0.7 1.2,0 -1.2,0.7"
                  fill="#60a5fa"
                  opacity="0.9"
                />
              </g>
            ))}
            {/* Start dot (green) */}
            {routeZones[0] && (
              <circle
                cx={routeZones[0].x}
                cy={routeZones[0].y}
                r="1.8"
                fill="#22c55e"
                stroke="white"
                strokeWidth="0.4"
                opacity="0.95"
              />
            )}
            {/* End dot (blue pulse) */}
            {routeZones[routeZones.length - 1] && (
              <>
                <circle
                  cx={routeZones[routeZones.length - 1].x}
                  cy={routeZones[routeZones.length - 1].y}
                  r="2.5"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="0.5"
                  opacity="0.4"
                />
                <circle
                  cx={routeZones[routeZones.length - 1].x}
                  cy={routeZones[routeZones.length - 1].y}
                  r="1.6"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="0.4"
                  opacity="0.95"
                />
              </>
            )}
          </>
        )}

        {/* Zone nodes */}
        {zones.map((z) => {
          const highlighted = highlightCodes.includes(z.code);
          const onRoute = routeCodes.includes(z.code);
          const emphasized = highlighted || onRoute;
          const r = emphasized ? 3.6 : 2.8;
          return (
            <g
              key={z.code}
              transform={`translate(${z.x}, ${z.y})`}
              className={onZoneClick ? 'cursor-pointer' : ''}
              onClick={() => onZoneClick?.(z)}
            >
              {emphasized && (
                <circle r={r + 1.6} fill="none" stroke={loadColor[z.load]} strokeWidth="0.35" opacity="0.5" />
              )}
              <circle
                r={r}
                fill={loadColor[z.load]}
                fillOpacity={emphasized ? 0.32 : 0.2}
                stroke={loadColor[z.load]}
                strokeWidth={emphasized ? 0.9 : 0.5}
              />
              <circle r={1.1} fill={loadColor[z.load]} />
            </g>
          );
        })}
      </svg>

      {/* Labels overlay — bright white for legibility */}
      <div className="pointer-events-none absolute inset-0">
        {zones.map((z) => {
          const onRoute = routeCodes.includes(z.code);
          const highlighted = highlightCodes.includes(z.code);
          const emphasized = onRoute || highlighted;
          return (
            <span
              key={z.code}
              className={`absolute -translate-x-1/2 whitespace-nowrap text-[8.5px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,1)] ${
                emphasized ? 'text-white' : 'text-slate-300'
              }`}
              style={{ left: `${z.x}%`, top: `${z.y + 4}%` }}
            >
              {z.name}
            </span>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-black/30 px-3 py-2 text-[10.5px] text-slate-300">
        {(['green', 'yellow', 'red'] as const).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: loadColor[l] }} />
            {loadLabel[l]}
          </span>
        ))}
        {routeCodes.length > 0 && (
          <span className="inline-flex items-center gap-1.5 ml-auto font-bold text-blue-300">
            <span className="flex items-center gap-0.5">
              <span className="h-0.5 w-3 rounded-full bg-blue-400" />
              <span className="border-l-[4px] border-l-blue-400 border-y-[3px] border-y-transparent h-0" />
            </span>
            Your route
          </span>
        )}
      </div>
    </div>
  );
}

export function zoneIconFor(type: string) {
  return ZONE_ICON[type] || Armchair;
}
