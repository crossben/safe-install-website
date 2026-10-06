import { en } from '@/content/en';
import { HeroTerminal } from '@/components/HeroTerminal';
import { HighlightedTabs } from '@/components/HighlightedTabs';
import { CopyButton } from '@/components/ui/CopyButton';

export function Hero() {
  const { hero } = en;

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Terminal-flavoured backdrop: dot grid plus an accent bloom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dot-grid opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="shell relative pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-5">
            <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
              {hero.promise}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {hero.subline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={hero.primaryCta.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-mono text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                {hero.primaryCta.label}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={hero.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {hero.secondaryCta.label}
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">$</span> safe-install check --ci
              </span>
              <CopyButton text="safe-install check --ci" label="Copy" />
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <HeroTerminal
              title={hero.terminalTitle}
              label={hero.scenariosLabel}
              replayLabel={hero.replayLabel}
              scenarios={hero.scenarios}
            />
            <p className="mt-1 font-mono text-[11px] text-muted">{hero.footnote}</p>
          </div>
        </div>

        <div className="mt-16 border-t border-line pt-10">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Install</h2>
            <p className="text-sm text-muted">No runtime required. One static binary.</p>
          </div>
          <HighlightedTabs
            items={hero.installTabs.map((tab) => ({
              id: tab.os.toLowerCase(),
              label: tab.os,
              samples: tab.samples.map((s) => ({
                label: s.label,
                lang: s.lang,
                code: s.code,
              })),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
