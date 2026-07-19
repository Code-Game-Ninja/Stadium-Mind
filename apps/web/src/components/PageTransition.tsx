'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

/**
 * Animates page content on every route change with a fade + subtle slide-up,
 * matching the `.rise` keyframe. Children are NOT remounted — only re-animated —
 * so page state, data, and persistent chrome stay intact. Respects reduced motion.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = scope.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 12, scale: 0.99 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'power3.out',
        clearProps: 'transform',
      }
    );
    return () => {
      tween.kill();
    };
  }, [pathname]);

  return (
    <div ref={scope} className="h-full will-change-[opacity,transform]">
      {children}
    </div>
  );
}
