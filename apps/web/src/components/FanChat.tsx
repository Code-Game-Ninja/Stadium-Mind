'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Panel, PanelHeader, StatusChip } from '@/components/ui';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

const SUGGESTIONS = [
  'Where is my gate?',
  'Can I get food before kickoff?',
  'Nearest washroom?',
  'Which route avoids stairs?',
  'Which gate is less crowded?',
];

export function FanChat({ matchId, ticketId }: { matchId: string; ticketId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text: ticketId
        ? 'Hi! I have your verified ticket context (demo ticket database). Ask me about your gate, seat, food, washrooms, or step-free routes.'
        : 'Hi! Ask me about gates, food, washrooms, and routes for this stadium. Verify a ticket for personalized answers.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const r = await api.fanChat({ matchId, ticketId, message: text });
      setMessages((m) => [...m, { role: 'ai', text: r.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', text: `Sorry, I could not answer: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    }
  }

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Fan AI Assistant"
        icon={<MessageSquare className="h-4 w-4 text-pitch-400" />}
        action={ticketId ? <StatusChip tone="green">Ticket-aware</StatusChip> : <StatusChip tone="slate">General</StatusChip>}
      />
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start gap-2'}>
            {m.role === 'ai' && (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitch-500/15 text-pitch-400">
                <Sparkles className="h-3 w-3" />
              </span>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-pitch-600 text-white'
                  : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pitch-500/15 text-pitch-400">
              <Sparkles className="h-3 w-3" />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-slate-400" style={{ animationDelay: '200ms' }} />
              <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-slate-400" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="chip border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-pitch-500/40 hover:bg-slate-100 hover:text-pitch-600 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Ask about your match day…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button className="btn-primary shrink-0" onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}
