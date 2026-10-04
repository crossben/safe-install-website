import { en } from '@/content/en';
import { rules } from '@/content/facts';
import { DocsBlock, DocsShell, Md, Snippet, section } from '@/components/docs/Docs';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { docsHref, docsMetadata } from '@/lib/docsPages';

const page = en.docs.monitor;
export const metadata = docsMetadata('monitor', page);

export default function Page() {
  return (
    <DocsShell slug="monitor" page={page}>
      <DocsBlock section={section(page, 'how')}>
        <Snippet id="monitor.commands" />
      </DocsBlock>
      <DocsBlock section={section(page, 'signals')}>
        <ul className="mt-4 flex flex-col gap-2.5">
          {rules
            .filter((r) => r.family === 'monitor')
            .map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-start sm:gap-4"
              >
                <a
                  href={`${docsHref('rules')}#${r.id}`}
                  className="shrink-0 font-mono text-xs text-accent hover:underline sm:w-28"
                >
                  {r.id}
                </a>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">
                  <Md text={r.signal.replace(/^Runtime monitor: /, '')} />
                </p>
                <SeverityBadge severity={r.severity} />
              </li>
            ))}
        </ul>
      </DocsBlock>
      <DocsBlock section={section(page, 'kill')} />
      <DocsBlock section={section(page, 'limits')} />
    </DocsShell>
  );
}
