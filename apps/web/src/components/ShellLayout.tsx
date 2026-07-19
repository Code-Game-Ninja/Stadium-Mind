'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AlertBroadcast } from '@/components/AlertBroadcast';
import { PageTransition } from '@/components/PageTransition';

// Portal routes (fan/match) animate inside SportsPortalLayout, so skip the
// shell-level transition there to avoid double-animating.
const PORTAL_PREFIXES = ['/fan', '/match'];

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPortal = PORTAL_PREFIXES.some((p) => pathname.startsWith(p));

  const handleBack = () => {
    if (pathname !== '/') {
      router.back();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      <AlertBroadcast />

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="w-full flex flex-col min-h-full">


          {/* Content Viewport */}
          <main className="flex-1">
            {isPortal ? children : <PageTransition>{children}</PageTransition>}
          </main>
        </div>
      </div>
    </div>
  );
}
