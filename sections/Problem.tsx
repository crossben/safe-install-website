import { en } from '@/content/en';
import { lifecycleScripts } from '@/content/facts';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function Problem() {
  const { problem } = en;
  const scripts = lifecycleScripts.value;

  return (
    <Section id="problem" eyebrow={problem.eyebrow} heading={problem.heading} lede={problem.lede}>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {problem.points.map((point, i) => (
          <Reveal key={point.title} className="h-full" delay={i * 0.08}>
            <article className="h-full border-t border-line pt-6">
              <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{point.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14" delay={0.1}>
        <div className="rounded-xl border border-accent/30 bg-accent-wash/50 p-6 sm:p-8">
          <p className="font-mono text-sm leading-relaxed text-ink">{problem.kicker}</p>
          <p className="mt-4 font-mono text-xs text-muted">
            The fields are{' '}
            {scripts.map((script, i) => (
              <span key={script}>
                {i > 0 ? ', ' : ''}
                <span className="text-accent">{script}</span>
              </span>
            ))}
            . Everything after this site assumes you know that.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
