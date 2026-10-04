import { en } from '@/content/en';
import { exitCodes } from '@/content/facts';
import { HighlightedCode } from '@/components/HighlightedCode';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function CI() {
  const { ci } = en;

  return (
    <Section id="ci" eyebrow={ci.eyebrow} heading={ci.heading} lede={ci.lede}>
      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <Reveal className="min-w-0 lg:col-span-7">
          <div>
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {ci.workflowTitle}
            </h3>
            <div className="mt-4">
              <HighlightedCode samples={[ci.workflow]} />
            </div>
          </div>
        </Reveal>

        <Reveal className="min-w-0 lg:col-span-5" delay={0.1}>
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {ci.commandHeading}
            </h3>
            <p className="mt-3 font-mono text-sm text-ink-soft">{ci.command}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{ci.flagNote}</p>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-6">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {ci.exitCodesHeading}
            </h3>
            <dl className="mt-4 flex flex-col gap-2.5">
              {exitCodes.value.map((exit) => (
                <div key={exit.code} className="flex items-start gap-3">
                  <dt className="shrink-0 font-mono text-sm text-accent">{exit.code}</dt>
                  <dd className="text-sm leading-relaxed text-muted">
                    <span className="font-mono text-ink-soft">{exit.name}</span> —{' '}
                    {exit.description}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-line pt-3 font-mono text-xs text-muted">
              {ci.exitCodesNote}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
