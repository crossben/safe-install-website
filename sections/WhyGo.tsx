import { en } from '@/content/en';
import {
  goRationale,
  releaseTargets,
  releaseIntegrity,
  notDistributedViaNpm,
} from '@/content/facts';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function WhyGo() {
  const { whyGo } = en;

  return (
    <Section id="why-go" eyebrow={whyGo.eyebrow} heading={whyGo.heading} lede={whyGo.lede}>
      <div className="mt-12 grid gap-x-8 gap-y-8 md:grid-cols-2">
        {whyGo.reasons.map((reason, i) => (
          <Reveal key={reason.title} className="min-w-0" delay={i * 0.05}>
            <div className="border-l-2 border-accent/40 pl-5">
              <h3 className="text-base font-semibold tracking-tight">{reason.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{reason.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14">
        <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
          {whyGo.comparisonHeading}
        </h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {whyGo.comparisonRows.map((row) => {
            const isChosen = row.verdict === 'Shipped';
            return (
              <article
                key={row.language}
                className={`rounded-lg border p-5 ${
                  isChosen ? 'border-accent/40 bg-accent-wash/40' : 'border-line bg-surface'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-mono text-sm font-medium">{row.language}</h4>
                  <span
                    className={`font-mono text-[11px] ${isChosen ? 'text-accent' : 'text-muted'}`}
                  >
                    {row.verdict}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{row.note}</p>
              </article>
            );
          })}
        </div>
        <p className="mt-4 font-mono text-xs text-muted">{goRationale.value}</p>
      </Reveal>

      <Reveal className="mt-10" delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="text-base font-semibold tracking-tight">{whyGo.notViaNpmHeading}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{whyGo.notViaNpmBody}</p>
            <p className="mt-4 border-t border-line pt-4 font-mono text-xs text-muted">
              “{notDistributedViaNpm.value}”
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="text-base font-semibold tracking-tight">{whyGo.releaseHeading}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{whyGo.releaseBody}</p>
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 font-mono text-xs text-muted">
              <li>targets: {releaseTargets.value}</li>
              <li>integrity: {releaseIntegrity.value.join(' · ')}</li>
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
