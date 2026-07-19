'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserCircle,
  Trophy,
  Newspaper,
  CalendarDays,
  PlayCircle,
  Megaphone,
  LogOut,
  Bell,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { LoginGate } from './LoginGate';
import { MobileTabBar, type MobileTab } from './MobileTabBar';
import { PageTransition } from './PageTransition';
import { cn } from '@/lib/utils';

export function SportsPortalLayout({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [clock, setClock] = React.useState<{ time: string; zone: string } | null>(null);

  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      const offsetMin = -now.getTimezoneOffset();
      const sign = offsetMin >= 0 ? '+' : '-';
      const hours = Math.floor(Math.abs(offsetMin) / 60);
      setClock({
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        zone: `GMT${sign}${hours}`,
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Extract matchId from a URL like /match/[matchId]/...
  const matchIdMatch = pathname.match(/\/match\/([^/]+)/);
  const matchId = matchIdMatch ? matchIdMatch[1] : null;

  const navLinks = [
    { href: '/fan/dashboard', label: 'Sports', icon: Trophy },
    { href: '/fan/news', label: 'News', icon: Newspaper },
    { href: '/fan/schedule', label: 'Schedule', icon: CalendarDays },
    {
      href: matchId ? `/match/${matchId}/journey` : '/fan/matches',
      label: 'Live Play',
      icon: PlayCircle,
    },
    {
      href: matchId ? `/match/${matchId}/players` : '/fan/players',
      label: 'Players',
      icon: UserCircle,
    },
    { href: '/fan/promotions', label: 'Promotions', icon: Megaphone },
  ];

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const mobileTabs: MobileTab[] = [
    { label: 'Sports', icon: Trophy, href: '/fan/dashboard', active: isActiveLink('/fan/dashboard') },
    { label: 'Schedule', icon: CalendarDays, href: '/fan/schedule', active: isActiveLink('/fan/schedule') },
    {
      label: 'Live',
      icon: PlayCircle,
      href: matchId ? `/match/${matchId}/journey` : '/fan/matches',
      active: isActiveLink('/fan/matches') || pathname.includes('/journey'),
    },
    { label: 'News', icon: Newspaper, href: '/fan/news', active: isActiveLink('/fan/news') },
    { label: 'Profile', icon: UserCircle, href: '/fan/profile', active: isActiveLink('/fan/profile') },
  ];

  return (
    <LoginGate role="fan">
      {(session, handleLogout) => (
        <div className="min-h-screen bg-ink">
          {/* Desktop icon rail */}
          <aside className="hidden md:flex fixed inset-y-0 left-0 w-[76px] flex-col items-center py-6 z-40">
            {/* Logo */}
            <Link
              href="/fan/dashboard"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-lime hover:scale-105 transition-transform"
              title="StadiumMind"
            >
              <Zap className="w-7 h-7 fill-current" />
            </Link>

            {/* Nav icons */}
            <nav className="mt-10 flex flex-col items-center gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isActiveLink(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    title={link.label}
                    className={cn(
                      'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200',
                      isActive
                        ? 'bg-lime text-ink shadow-lg shadow-black/40 scale-105'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </nav>

            {/* Bottom actions */}
            <div className="mt-auto flex flex-col items-center gap-3">
              <Link
                href="/fan/profile"
                title="My Profile"
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center transition-all',
                  pathname === '/fan/profile'
                    ? 'bg-lime text-ink shadow-lg shadow-black/40'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <UserCircle className="w-5 h-5" />
              </Link>
              <button
                onClick={() => {
                  if (onLogout) onLogout();
                  handleLogout();
                }}
                title="Log out"
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </aside>

          {/* Content sheet */}
          <div className="md:pl-[76px] min-h-screen flex flex-col">
            <div className="flex-1 flex flex-col min-h-screen bg-cream md:rounded-l-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden">
              {/* Top bar */}
              <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur-md border-b border-slate-200/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-16 gap-4">
                    {/* Mobile logo */}
                    <Link href="/fan/dashboard" className="md:hidden flex items-center gap-2 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime shadow-sm">
                        <Zap className="w-4 h-4 fill-current" />
                      </div>
                      <span className="text-base font-bold text-slate-900 tracking-tight">
                        StadiumMind
                      </span>
                    </Link>

                    {/* Active page title */}
                    <div className="hidden md:flex items-center gap-2">
                      {(() => {
                        const active = navLinks.find((link) => isActiveLink(link.href));
                        const Icon = active?.icon ?? Trophy;
                        return (
                          <>
                            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-lime text-ink">
                              <Icon className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-black text-slate-900 tracking-tight">
                              {active?.label ?? 'StadiumMind'}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Clock chip */}
                      <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {clock?.time ?? '--:--'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {clock ? `(${clock.zone})` : ''}
                        </span>
                      </div>

                      {/* Live badge */}
                      <div className="hidden lg:flex items-center gap-1.5 px-3 h-9 bg-lime/40 border border-lime-600/30 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" />
                        <span className="text-[10px] font-bold text-ink uppercase tracking-wider">Live</span>
                      </div>

                      {/* Profile avatar */}
                      <Link
                        href="/fan/profile"
                        title={session.displayName}
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm',
                          pathname === '/fan/profile'
                            ? 'bg-lime text-ink'
                            : 'bg-ink text-white hover:bg-ink-700'
                        )}
                      >
                        {(session.displayName || 'F').charAt(0).toUpperCase()}
                      </Link>

                      {/* Mobile hamburger */}
                      <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                      >
                        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu — secondary links (primary nav lives in the bottom tab bar) */}
                {mobileOpen && (
                  <div className="md:hidden border-t border-slate-100 bg-white py-2 px-4 space-y-1">
                    <Link
                      href="/fan/promotions"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActiveLink('/fan/promotions') ? 'bg-lime/40 text-ink' : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <Megaphone className="w-4 h-4" /> Promotions
                    </Link>
                    <Link
                      href={matchId ? `/match/${matchId}/players` : '/fan/players'}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActiveLink('/fan/players') ? 'bg-lime/40 text-ink' : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <UserCircle className="w-4 h-4" /> Players
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Bell className="w-4 h-4" /> About StadiumMind
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        if (onLogout) onLogout();
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                )}
              </header>

              {/* Page Content */}
              <main className="flex-1 p-4 md:p-6 lg:p-8 pb-28 md:pb-8">
                <div className="max-w-7xl mx-auto">
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
            </div>
          </div>

          {/* Floating mobile tab bar */}
          <MobileTabBar items={mobileTabs} />
        </div>
      )}
    </LoginGate>
  );
}
