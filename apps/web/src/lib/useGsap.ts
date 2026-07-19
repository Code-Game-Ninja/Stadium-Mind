'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';

/**
 * Scoped GSAP reveal. Animates children marked with `data-animate` inside the
 * returned ref with a staggered fade/slide-up on mount. Respects reduced motion.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  deps: unknown[] = []
): RefObject<T> {
  const scope = useRef<T>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-animate]');
      if (!targets.length) return;
      if (reduce) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }
      gsap.from(targets, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.07,
        clearProps: 'transform',
      });
    }, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/**
 * Animated number that counts up to `value` with GSAP whenever it changes.
 * Returns the current display value (integer or fixed decimals).
 */
export function useCountUp(value: number, opts: { decimals?: number; duration?: number } = {}) {
  const { decimals = 0, duration = 1.1 } = opts;
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const obj = { n: prev.current };
    const tween = gsap.to(obj, {
      n: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplay(obj.n),
      onComplete: () => {
        prev.current = value;
      },
    });
    return () => {
      tween.kill();
      prev.current = value;
    };
  }, [value, duration]);

  return decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
}
