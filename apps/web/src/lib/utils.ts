import type { ZoneLoad } from '@stadiummind/shared';

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function minutesToKickoff(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.round(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export const loadColor: Record<ZoneLoad, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export const loadLabel: Record<ZoneLoad, string> = {
  green: 'Normal',
  yellow: 'Busy',
  red: 'Congested',
};

export function healthTone(score: number): { label: string; color: string; text: string } {
  if (score >= 80) return { label: 'Healthy', color: '#22c55e', text: 'text-pitch-400' };
  if (score >= 60) return { label: 'Watch', color: '#eab308', text: 'text-signal-yellow' };
  return { label: 'Critical', color: '#ef4444', text: 'text-signal-red' };
}
