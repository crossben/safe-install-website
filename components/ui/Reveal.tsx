'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * Used for section headers and cards. Under `prefers-reduced-motion: reduce`
 * nothing animates — `matchMedia` drops the whole timeline, and because the
 * animation starts from `opacity: 1` the content is never hidden behind a
 * motion preference.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  stagger = 0.06,
  as: Tag = 'div',
  selector = '[data-reveal]',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: number;
  as?: 'div' | 'section' | 'ul' | 'ol';
  selector?: string;
}) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(selector, scope.current);
      if (targets.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            delay,
            stagger,
            ease: 'power2.out',
            scrollTrigger: { trigger: scope.current, start: 'top 85%', once: true },
          },
        );
      });

      // `revert` removes both the timeline and the inline styles GSAP applied,
      // which is what makes the reduced-motion path show the final state rather
      // than a half-applied one.
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <Tag ref={scope as never} className={className}>
      {children}
    </Tag>
  );
}
