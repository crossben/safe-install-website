'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useRef, useState } from 'react';

import type { TerminalLine } from '@/content/types';

const TONE_CLASS: Record<string, string> = {
  prompt: 'text-term-accent',
  muted: 'text-term-muted',
  info: 'text-term-ink',
  warn: 'text-term-accent',
  danger: 'text-term-danger',
  ok: 'text-term-ok',
};

/**
 * The hero terminal, typed out character by character.
 *
 * The whole session is one string; a GSAP tween advances a character counter
 * and the visible slice is derived from it, which keeps the DOM cheap (no
 * per-character nodes) and lets the caret ride the end of the text.
 *
 * Under `prefers-reduced-motion: reduce` the tween is never created and the
 * full session renders immediately — the content is identical either way.
 */
export function HeroTerminal({
  title,
  lines,
}: {
  title: string;
  lines: readonly TerminalLine[];
}) {
  const scope = useRef<HTMLDivElement>(null);
  const fullText = lines.map((line) => line.text).join('\n');
  const totalChars = fullText.length;

  // Starts at 0 on the server and on the first client render, so hydration
  // matches; the effect below is what starts the typing.
  const [chars, setChars] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const counter = { value: 0 };
        const tween = gsap.to(counter, {
          value: totalChars,
          duration: Math.min(totalChars * 0.012, 6),
          ease: 'none',
          onUpdate: () => setChars(Math.floor(counter.value)),
        });
        return () => tween.kill();
      });

      // Reduced motion: show the finished session straight away.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setChars(totalChars);
      }
    },
    { scope },
  );

  const visible = fullText.slice(0, chars);
  const atEnd = chars >= totalChars;

  // Split the visible slice back into lines, and find which tone the caret
  // currently belongs to.
  const visibleLines = visible.split('\n');
  const currentTone = (() => {
    let remaining = visible.length;
    for (const line of lines) {
      if (remaining <= line.text.length + 1) return line.tone ?? 'muted';
      remaining -= line.text.length + 1;
    }
    return 'prompt';
  })();

  return (
    <div
      ref={scope}
      className="overflow-hidden rounded-xl border border-line bg-term-bg shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-1.5 font-mono text-[11px] tracking-wide text-term-muted">
          {title}
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto p-4 sm:p-5">
        <span aria-hidden="true" className="select-none font-mono text-xs leading-[1.7] text-term-muted/60">
          1
        </span>
        <pre className="min-w-0 flex-1 font-mono text-[12.5px] leading-[1.7] whitespace-pre sm:text-[13px]">
          {visibleLines.map((line, i) => {
            const isLast = i === visibleLines.length - 1;
            const tone = isLast && !atEnd ? currentTone : (lines[i]?.tone ?? 'muted');
            return (
              <span key={i} className={`block ${TONE_CLASS[tone] ?? ''}`}>
                {line === '' ? ' ' : line}
              </span>
            );
          })}
          {!atEnd ? (
            <span className={`-mb-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] animate-pulse ${TONE_CLASS[currentTone] ?? ''} bg-current`} />
          ) : null}
        </pre>
      </div>
    </div>
  );
}