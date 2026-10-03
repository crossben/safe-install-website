import { en } from '@/content/en';
import { coreIdea } from '@/content/facts';
import { HowItWorksDiagram } from '@/components/HowItWorksDiagram';
import { Section } from '@/components/ui/Section';

export function HowItWorks() {
  const { howItWorks } = en;

  return (
    <Section
      id="how-it-works"
      eyebrow={howItWorks.eyebrow}
      heading={howItWorks.heading}
      lede={howItWorks.lede}
    >
      <HowItWorksDiagram
        steps={howItWorks.steps.map((step) => ({
          id: step.id,
          title: step.title,
          body: step.body,
        }))}
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">
          <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
            Why this works everywhere
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {coreIdea.value} Separating the two is what makes this work everywhere without
            OS-specific tricks — which is why the runtime monitor at the bottom of this page is the
            only part that is Linux-only.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
            What leaves the machine
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{howItWorks.note}</p>
        </div>
      </div>
    </Section>
  );
}
