'use client';

import { cn } from '@/lib/utils';
import { useEffect, type ComponentType, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('panel', className)}>{children}</section>;
}

export function PanelHeader({
  title,
  icon,
  action,
  subtitle,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="panel-header bg-slate-50/50 rounded-t-[20px]">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          {icon}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'slate' | 'amber';

export function StatusChip({ tone, children, title }: { tone: Tone; children: ReactNode; title?: string }) {
  const map: Record<Tone, string> = {
    green: 'border-teal-200 bg-teal-50 text-teal-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    red: 'border-red-200 bg-red-50/70 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-orange-200 bg-orange-50 text-orange-700',
    slate: 'border-slate-200 bg-slate-100 text-slate-600',
  };
  return <span className={cn('chip', map[tone])} title={title}>{children}</span>;
}

// Small animated live indicator (green dot with a soft pulsing halo).
export function LivePulse({
  label,
  tone = 'green',
  className,
}: {
  label?: string;
  tone?: 'green' | 'red' | 'amber';
  className?: string;
}) {
  const color = tone === 'red' ? 'bg-signal-red' : tone === 'amber' ? 'bg-signal-amber' : 'bg-pitch-500';
  const text = tone === 'red' ? 'text-signal-red' : tone === 'amber' ? 'text-signal-amber' : 'text-pitch-600';
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', color)} />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', color)} />
      </span>
      {label && <span className={cn('text-xs font-semibold', text)}>{label}</span>}
    </span>
  );
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-sm text-slate-500", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-pitch-500" />
      {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-400">
      {icon && <div className="text-slate-300">{icon}</div>}
      {children}
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#0d9488' : value >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="w-9 text-right text-xs font-bold tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// Reusable page container with consistent max width + padding.
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4', className)}>{children}</div>;
}

// Section header with eyebrow + title + optional description and right-side action.
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="section-eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="text-lg font-bold tracking-tight text-slate-800 sm:text-xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-pitch-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  amber: 'text-orange-600',
  slate: 'text-slate-700',
};
const TONE_ICON_BG: Record<Tone, string> = {
  green: 'bg-pitch-500/10 text-pitch-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-orange-50 text-orange-600',
  slate: 'bg-slate-100 text-slate-500',
};

// Compact metric tile used across dashboards.
export function MetricTile({
  icon: Icon,
  label,
  value,
  tone = 'slate',
  hint,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="stat-tile hover:border-slate-300">
      <div className="mb-1.5 flex items-center gap-2">
        {Icon && (
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', TONE_ICON_BG[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className={cn('truncate text-lg font-bold capitalize tabular-nums', TONE_TEXT[tone])}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{hint}</div>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  icon,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel max-h-[85vh] w-full max-w-lg animate-scale-in overflow-y-auto shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header sticky top-0 z-10 bg-white/95 backdrop-blur">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            {icon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
