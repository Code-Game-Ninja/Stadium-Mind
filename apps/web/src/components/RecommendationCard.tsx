'use client';

import { useState } from 'react';
import type { Recommendation } from '@stadiummind/shared';
import { ConfidenceBar, StatusChip, Modal } from '@/components/ui';
import { Check, X, HelpCircle, Target, Lightbulb, Sparkles, Loader2 } from 'lucide-react';

export function RecommendationCard({
  rec,
  onApply,
  onDismiss,
  busy,
}: {
  rec: Recommendation;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  busy: boolean;
}) {
  const [why, setWhy] = useState(false);
  const [acting, setActing] = useState<'apply' | 'dismiss' | null>(null);
  const decided = rec.status !== 'pending';

  const handle = (kind: 'apply' | 'dismiss') => {
    setActing(kind);
    (kind === 'apply' ? onApply : onDismiss)(rec.id);
  };

  return (
    <div className="animate-fade-in-fast rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-slate-300">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="flex items-start gap-2 text-xs font-bold text-slate-800">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pitch-600" />
          {rec.title}
        </h3>
        {rec.status === 'pending' && <StatusChip tone="blue">Pending</StatusChip>}
        {rec.status === 'applied' && <StatusChip tone="green">Applied</StatusChip>}
        {rec.status === 'dismissed' && <StatusChip tone="slate">Dismissed</StatusChip>}
      </div>

      <p className="mb-3 text-xs font-medium leading-relaxed text-slate-600">{rec.action}</p>

      <div className="mb-3">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">AI confidence</div>
        <ConfidenceBar value={rec.confidence} />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {rec.impactedZones.map((z) => (
          <span key={z} className="chip border-slate-200 bg-white font-mono text-[10px] text-slate-500">
            {z}
          </span>
        ))}
      </div>

      {!decided ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary text-xs py-1 px-3" disabled={busy} onClick={() => handle('apply')}>
            {busy && acting === 'apply' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Apply
          </button>
          <button className="btn-ghost text-xs py-1 px-3" disabled={busy} onClick={() => handle('dismiss')}>
            {busy && acting === 'dismiss' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Dismiss
          </button>
          <button className="btn-ghost text-xs py-1 px-3" onClick={() => setWhy(true)}>
            <HelpCircle className="h-3.5 w-3.5" /> Why?
          </button>
        </div>
      ) : (
        <button className="btn-ghost text-xs py-1 px-3" onClick={() => setWhy(true)}>
          <HelpCircle className="h-3.5 w-3.5" /> Why?
        </button>
      )}

      {why && (
        <Modal title={`Why: ${rec.title}`} icon={<Lightbulb className="h-4 w-4 text-pitch-600" />} onClose={() => setWhy(false)}>
          <div className="space-y-4 text-xs">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Lightbulb className="h-3.5 w-3.5" /> Reasoning
              </div>
              <p className="leading-relaxed text-slate-700 font-medium">{rec.reason}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Target className="h-3.5 w-3.5" /> Expected outcome
              </div>
              <p className="leading-relaxed text-slate-700 font-medium">{rec.expectedOutcome}</p>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Confidence</div>
              <ConfidenceBar value={rec.confidence} />
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Source signals</div>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                {JSON.stringify(rec.sourceSignals, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
