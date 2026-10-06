'use client';

import { useEffect, useRef, useState } from 'react';

import type { TerminalLine, TerminalScenario } from '@/content/types';

const TONE_CLASS: Record<string, string> = {
  prompt: 'text-term-accent',
  muted: 'text-term-muted',
  info: 'text-term-ink',
  warn: 'text-term-accent',
  danger: 'text-term-danger',
  ok: 'text-term-ok',
};

/** Timing, in ms. Commands are typed; output lines appear one at a time. */
const TYPE_MS = 38;
const AFTER_COMMAND_MS = 380;
const LINE_MS = 70;
const BLANK_MS = 30;
const HOLD_MS = 4200; // how long a finished session stays before the next one

/** How far a session has played: whole lines shown, plus characters of the next. */
type Progress = { lines: number; chars: number };

const done = (lines: readonly TerminalLine[]): Progress => ({ lines: lines.length, chars: 0 });

/**
 * The hero terminal: a set of real sessions, one per thing safe-install does.
 *
 * Until the visitor picks one, the sessions play in turn. Picking one plays it
 * and stops the rotation. The server and the first client render show the
 * first session complete, so the page is meaningful without JavaScript and
 * hydration matches; under `prefers-reduced-motion` nothing animates and the
 * buttons simply switch sessions.
 */
export function HeroTerminal({
  title,
  label,
  replayLabel,
  scenarios,
}: {
  title: string;
  label: string;
  replayLabel: string;
  scenarios: readonly TerminalScenario[];
}) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>(() => done(scenarios[0]?.lines ?? []));
  const [run, setRun] = useState(0); // bumps to (re)start playback
  const auto = useRef(true);
  const reduced = useRef(false);
  const started = useRef(false);
  const screen = useRef<HTMLPreElement>(null);

  const scenario = scenarios[index] ?? scenarios[0];
  const lines = scenario?.lines ?? [];

  // Start the first animated run after hydration.
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced.current && !started.current) {
      started.current = true;
      setRun((r) => r + 1);
    }
  }, []);

  // Play the current scenario.
  useEffect(() => {
    if (run === 0 || reduced.current) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const step = (p: Progress) => {
      if (cancelled) return;
      setProgress(p);
      const line = lines[p.lines];
      if (!line) {
        if (auto.current && scenarios.length > 1) {
          timer = setTimeout(() => {
            setIndex((i) => (i + 1) % scenarios.length);
            setRun((r) => r + 1);
          }, HOLD_MS);
        }
        return;
      }
      if (line.tone === 'prompt' && p.chars < line.text.length) {
        timer = setTimeout(() => step({ lines: p.lines, chars: p.chars + 1 }), TYPE_MS);
      } else {
        const wait =
          line.tone === 'prompt' ? AFTER_COMMAND_MS : line.text === '' ? BLANK_MS : LINE_MS;
        timer = setTimeout(() => step({ lines: p.lines + 1, chars: 0 }), wait);
      }
    };
    step({ lines: 0, chars: 0 });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `lines` follows `index`; a new run is what restarts playback.
  }, [run]);

  // Follow the output, as a terminal does.
  useEffect(() => {
    const el = screen.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [progress, index]);

  const choose = (i: number) => {
    auto.current = false;
    setIndex(i);
    if (reduced.current) {
      setProgress(done(scenarios[i]?.lines ?? []));
    } else {
      setRun((r) => r + 1);
    }
  };

  const finished = progress.lines >= lines.length;
  const shown = lines.slice(0, progress.lines);
  const typing = lines[progress.lines];

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="mb-3 flex flex-wrap gap-1.5"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const next =
            (index + (e.key === 'ArrowRight' ? 1 : scenarios.length - 1)) % scenarios.length;
          choose(next);
          (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
        }}
      >
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`term-tab-${s.id}`}
            aria-selected={i === index}
            aria-controls="term-panel"
            tabIndex={i === index ? 0 : -1}
            onClick={() => choose(i)}
            className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
              i === index
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-surface text-muted hover:border-accent hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        id="term-panel"
        role="tabpanel"
        aria-labelledby={`term-tab-${scenario?.id ?? ''}`}
        className="overflow-hidden rounded-xl border border-line bg-term-bg shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="ml-1.5 min-w-0 flex-1 truncate font-mono text-[11px] tracking-wide text-term-muted">
            {title}
          </span>
          {finished ? (
            <button
              type="button"
              onClick={() => choose(index)}
              className="font-mono text-[11px] text-term-muted transition-colors hover:text-term-ink"
            >
              ↻ {replayLabel}
            </button>
          ) : null}
        </div>

        {/* Fixed height: switching sessions never moves the page. Long lines
            wrap rather than scroll sideways. */}
        <pre
          ref={screen}
          className="h-[31.5rem] overflow-y-auto [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin] p-4 font-mono text-[12px] leading-[1.65] break-words whitespace-pre-wrap sm:p-5 sm:text-[12.5px]"
        >
          {shown.map((line, i) => (
            <span key={i} className={`block ${TONE_CLASS[line.tone ?? 'muted'] ?? ''}`}>
              {line.text === '' ? ' ' : line.text}
            </span>
          ))}
          {typing ? (
            <span className={`block ${TONE_CLASS[typing.tone ?? 'muted'] ?? ''}`}>
              {typing.tone === 'prompt' ? typing.text.slice(0, progress.chars) : ''}
              <span className="ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-current" />
            </span>
          ) : (
            <span className="block text-term-accent">
              ${' '}
              <span className="inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-current" />
            </span>
          )}
        </pre>
      </div>
      <p className="mt-3 min-h-[2.5em] text-sm leading-relaxed text-muted">{scenario?.caption}</p>
    </div>
  );
}
