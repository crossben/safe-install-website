'use client';

import { useEffect, useState } from 'react';

import type { MonitorCopy, Roast } from '@/content/types';

type Os = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Best-effort platform detection.
 *
 * Prefers the structured `userAgentData.platform`, which returns a normalised
 * value like "macOS" or "Windows"; falls back to sniffing `navigator.userAgent`.
 * This is presentation only — it decides which joke to show and gates nothing.
 */
function detectOs(): Os {
  const hint =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';

  const haystack = `${hint} ${navigator.userAgent}`.toLowerCase();

  // Android reports "Linux" in its UA, so it has to be ruled out first.
  if (/android/.test(haystack)) return 'unknown';
  if (/win/.test(haystack)) return 'windows';
  if (/mac|iphone|ipad/.test(haystack)) return 'macos';
  if (/linux|x11|cros/.test(haystack)) return 'linux';
  return 'unknown';
}

export function OsRoast({ copy }: { copy: MonitorCopy }) {
  // Static export renders this neutrally on the server and during hydration;
  // the joke is swapped in afterwards so the two trees never disagree.
  const [os, setOs] = useState<Os | null>(null);

  useEffect(() => {
    setOs(detectOs());
  }, []);

  const roast: Roast | null = os ? copy.roasts[os] : null;

  return (
    <div
      aria-live="polite"
      className="overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div className="flex items-start gap-4 p-5 sm:p-7">
        <span
          aria-hidden="true"
          className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 font-mono text-lg sm:flex"
        >
          {roast?.isSmug ? '✓' : os === null ? '·' : '✗'}
        </span>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-balance">
            {roast ? roast.headline : copy.neutral}
          </h3>

          {roast ? (
            <div className="mt-4 flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {roast.jabs.map((jab) => (
                  <li key={jab} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <span aria-hidden="true" className="text-accent">
                      ▸
                    </span>
                    <span>{jab}</span>
                  </li>
                ))}
              </ul>

              {roast.cta ? (
                <p className="mt-1 font-mono text-sm text-ink">{roast.cta}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* The honest line, shown whichever platform was detected. */}
      <p className="border-t border-line bg-surface-2 px-5 py-3 font-mono text-xs text-muted sm:px-7">
        {copy.honest}
      </p>
    </div>
  );
}