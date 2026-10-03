'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

import type { Step } from '@/content/types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The five-step pipeline from the plan, drawn on scroll.
 *
 * Layout flips from a vertical track (narrow screens) to a horizontal one
 * (`lg` and up), and each orientation gets its own GSAP tween through
 * `matchMedia` so the connector draws along the correct axis.
 *
 * The steps are a real `<ol>` — the order is meaningful, and a screen reader
 * should be able to read "step 3 of 5" whether or not the animation runs.
 */
export function HowItWorksDiagram({ steps }: { steps: readonly Step[] }) {
  const scope = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-step]',
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: { trigger: scope.current, start: 'top 78%', once: true },
          },
        );
      });

      // The connector draws proportionally to scroll position rather than
      // firing once, so scrubbing back and forth tracks the page.
      mm.add('(min-width: 64rem) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-track]',
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top 72%',
              end: 'bottom 62%',
              scrub: 0.4,
            },
          },
        );
      });

      mm.add('(max-width: 63.999rem) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-track]',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top 72%',
              end: 'bottom 70%',
              scrub: 0.4,
            },
          },
        );
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <ol ref={scope} className="relative mt-14 grid gap-10 lg:grid-cols-5 lg:gap-5">
      {/* Connector: a vertical rule on narrow screens, horizontal on wide. */}
      <span
        data-track
        aria-hidden="true"
        className="absolute top-2 left-[15px] h-[calc(100%-1rem)] w-px origin-top bg-line-strong lg:top-[15px] lg:left-2 lg:h-px lg:w-[calc(100%-1rem)] lg:origin-left lg:scale-x-0"
      />

      {steps.map((step, i) => (
        <li key={step.id} data-step className="relative pl-11 lg:pl-0">
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg font-mono text-xs text-accent lg:relative lg:mb-5"
          >
            {i + 1}
          </span>

          <div className="lg:pr-2">
            <h3 className="font-mono text-sm font-medium tracking-tight text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
