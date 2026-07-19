'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type MobileTab = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

/**
 * Floating dark "pill" bottom navigation for mobile — native-app feel.
 * The active tab expands into a lime pill with its label; the rest stay icon-only.
 * Hidden on md+ (desktop uses the sidebar / top bar).
 */
export function MobileTabBar({ items }: { items: MobileTab[] }) {
  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      <div className="flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <nav className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink/95 backdrop-blur-xl px-2 py-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] ring-1 ring-white/10 animate-fade-in-fast">
          {items.map((item) => {
            const Icon = item.icon;
            const inner = (
              <span
                className={cn(
                  'flex items-center gap-2 rounded-full transition-all duration-300 ease-out active:scale-95',
                  item.active
                    ? 'bg-lime text-ink px-4 py-2.5 shadow-md shadow-lime/20'
                    : 'text-white/55 hover:text-white px-2.5 py-2.5'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.active && (
                  <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>
                )}
              </span>
            );

            return item.href ? (
              <Link key={item.label} href={item.href} aria-label={item.label} className="outline-none">
                {inner}
              </Link>
            ) : (
              <button key={item.label} onClick={item.onClick} aria-label={item.label} className="outline-none">
                {inner}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
