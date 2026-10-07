import { en } from '@/content/en';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { CopyButton } from '@/components/ui/CopyButton';
import { agentsGuide } from '@/lib/agents';
import { highlight } from '@/lib/highlight';

export async function Agents() {
  const { agents } = en;
  const guide = agentsGuide();
  const html = await highlight(guide, 'markdown');

  return (
    <Section id="agents" eyebrow={agents.eyebrow} heading={agents.heading} lede={agents.lede}>
      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <Reveal className="min-w-0 lg:col-span-5">
          <ul className="flex flex-col gap-3">
            {agents.rules.map((rule) => (
              <li key={rule} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-accent"
                />
                {rule}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl border border-line bg-surface p-6">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {agents.commandHeading}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <code className="font-mono text-sm text-ink-soft">{agents.command}</code>
              <CopyButton text={agents.command} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{agents.commandNote}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <a href="/llms.txt" className="font-mono text-accent hover:underline">
                /llms.txt
              </a>{' '}
              · {agents.llmsTxtNote}
            </p>
          </div>
        </Reveal>

        <Reveal className="min-w-0 lg:col-span-7" delay={0.1}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {agents.promptLabel}
            </h3>
            <CopyButton text={guide} label={agents.copyLabel} />
          </div>
          <div className="max-h-[32rem] overflow-y-auto rounded-xl [scrollbar-width:thin] [&_pre]:break-words [&_pre]:whitespace-pre-wrap">
            <CodeBlock html={html} code={guide} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
