import { en } from '@/content/en';
import {
  rules,
  scoring,
  explainability,
  lowNoiseGoal,
  minReleaseAgeExclude,
  releaseAgeNativeSettings,
  type RuleFamily,
} from '@/content/facts';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { SeverityBadge } from '@/components/ui/SeverityBadge';

export function Checks() {
  const { checks } = en;

  const byFamily = new Map<RuleFamily, (typeof rules)[number][]>();
  for (const rule of rules) {
    const bucket = byFamily.get(rule.family);
    if (bucket) bucket.push(rule);
    else byFamily.set(rule.family, [rule]);
  }

  return (
    <Section id="checks" eyebrow={checks.eyebrow} heading={checks.heading} lede={checks.lede}>
      <div className="mt-14 flex flex-col gap-10">
        {checks.families.map((family) => {
          const familyRules = byFamily.get(family.id) ?? [];
          if (familyRules.length === 0) return null;

          return (
            <Reveal key={family.id}>
              <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
                <div className="min-w-0 lg:col-span-4">
                  <h3 className="text-base font-semibold tracking-tight">{family.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{family.blurb}</p>
                </div>

                <ul className="flex min-w-0 flex-col gap-2.5 lg:col-span-8">
                  {familyRules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-start sm:gap-4"
                    >
                      <code className="shrink-0 font-mono text-xs text-accent sm:w-28">
                        {rule.id}
                      </code>
                      <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">
                        {/* The signal column is markdown; render the code spans. */}
                        {rule.signal.split(/(`[^`]+`)/g).map((part, i) =>
                          part.startsWith('`') && part.endsWith('`') ? (
                            <code
                              key={i}
                              className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs"
                            >
                              {part.slice(1, -1)}
                            </code>
                          ) : (
                            <span key={i}>{part}</span>
                          ),
                        )}
                      </p>
                      <SeverityBadge severity={rule.severity} />
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-14" delay={0.1}>
        <div className="rounded-xl border border-accent/35 bg-accent-wash/40 p-6 sm:p-8">
          <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            Release-age gate
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-balance">
            {checks.releaseAgeGate.heading}
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">
            {checks.releaseAgeGate.body}
          </p>

          <dl className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface/70 p-4">
              <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">
                Native setting
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                {checks.releaseAgeGate.native}
              </dd>
              <dd className="mt-2 font-mono text-xs text-accent">
                {releaseAgeNativeSettings.value}
              </dd>
            </div>

            <div className="rounded-lg border border-line bg-surface/70 p-4">
              <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">
                Yarn classic
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                {checks.releaseAgeGate.fallback}
              </dd>
            </div>

            <div className="rounded-lg border border-line bg-surface/70 p-4">
              <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">Escapes</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                {checks.releaseAgeGate.override}
              </dd>
              <dd className="mt-2 font-mono text-xs text-accent">
                minReleaseAgeExclude: {minReleaseAgeExclude.value}
              </dd>
            </div>
          </dl>

          <p className="mt-5 font-mono text-xs text-muted">{checks.releaseAgeGate.credit}</p>
        </div>
      </Reveal>

      <Reveal className="mt-14" delay={0.1}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Scoring</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{checks.scoringNote}</p>
            <p className="mt-3 font-mono text-xs text-muted">
              <span className="text-ok">low {scoring.value.low}</span> ·{' '}
              <span className="text-accent">medium {scoring.value.medium}</span> ·{' '}
              <span className="text-danger">high {scoring.value.high}</span>
            </p>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Severities</h3>
            <dl className="mt-3 flex flex-col gap-2">
              {checks.severities.map((severity) => (
                <div key={severity.id} className="flex items-start gap-2">
                  <dt className="shrink-0">
                    <SeverityBadge severity={severity.id} />
                  </dt>
                  <dd className="text-xs leading-relaxed text-muted">{severity.description}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              Explainable, and quiet
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{explainability.value}.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{lowNoiseGoal.value}.</p>
            <p className="mt-3 font-mono text-xs text-accent">{checks.explainNote}</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
