'use client';

import { useRef } from 'react';

import { en } from '@/content/en';

/** The section menu below 1280px, where the full nav does not fit. Closes when a link is chosen. */
export function NavMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="relative xl:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[13px] text-muted transition-colors hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        {en.menuLabel}
      </summary>
      <nav
        aria-label="Sections"
        className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-line bg-surface p-1.5 shadow-lg"
      >
        <ul className="flex flex-col">
          {en.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => ref.current?.removeAttribute('open')}
                className="block rounded-md px-3 py-2 font-mono text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
