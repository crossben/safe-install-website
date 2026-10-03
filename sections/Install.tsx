import { en } from '@/content/en';
import { notDistributedViaNpm } from '@/content/facts';
import { HighlightedCode } from '@/components/HighlightedCode';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function Install() {
  const { install } = en;

  return (
    <Section id="install" eyebrow={install.eyebrow} heading={install.heading} lede={install.lede}>
      <div className="mt-12 grid gap-x-8 gap-y-8 md:grid-cols-2">
        {install.methods.map((method, i) => (
          <Reveal key={method.id} className="min-w-0" delay={i * 0.06}>
            <div className="h-full">
              <h3 className="text-base font-semibold tracking-tight">{method.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{method.summary}</p>
              <div className="mt-4">
                <HighlightedCode samples={method.samples} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12" delay={0.1}>
        <div className="rounded-xl border border-accent/30 bg-accent-wash/40 p-6">
          <p className="text-sm leading-relaxed text-ink">{install.dropInNote}</p>
          <p className="mt-3 font-mono text-xs text-muted">“{notDistributedViaNpm.value}”</p>
        </div>
      </Reveal>
    </Section>
  );
}
