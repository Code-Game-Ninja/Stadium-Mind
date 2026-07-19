import { PageShell } from '@/components/ui';
import { MatchHubSection } from '@/components/MatchHubSection';
import { MerchandiseSection } from '@/components/MerchandiseSection';

export default function LandingPage() {
  return (
    <div className="relative bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* faint operations grid backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-grid-faint [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <PageShell className="space-y-16 sm:space-y-20 py-12">
        {/* ---------------- MATCH HUB ---------------- */}
        <MatchHubSection />
        
        {/* ---------------- MERCHANDISE ---------------- */}
        <MerchandiseSection />

        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t border-slate-200 pt-6 pb-2 text-[11px] font-medium text-slate-500">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <span>StadiumMind AI · FIFA World Cup 2026</span>
            <span>Fan Match Hub Prototype</span>
          </div>
        </footer>
      </PageShell>
    </div>
  );
}
