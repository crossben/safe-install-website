import { en } from '@/content/en';
import { packageManagers, pmDetectionOrder } from '@/content/facts';
import { DefTable, DocsBlock, DocsShell, Md, Snippet, section } from '@/components/docs/Docs';
import { docsMetadata } from '@/lib/docsPages';

const page = en.docs.usage;
export const metadata = docsMetadata('usage', page);

export default function Page() {
  const pmCols = en.packageManagers.columns;
  return (
    <DocsShell slug="usage" page={page}>
      <DocsBlock section={section(page, 'install')}>
        <Snippet id="usage.install" />
      </DocsBlock>
      <DocsBlock section={section(page, 'flow')} />
      <DocsBlock section={section(page, 'prompt')}>
        <DefTable head={['Answer', 'Effect']} rows={page.answers.map((a) => [a.key, a.meaning])} />
      </DocsBlock>
      <DocsBlock section={section(page, 'modes')}>
        <DefTable
          head={['When', 'What happens']}
          mono={false}
          rows={page.modes.map((m) => [m.when, m.what])}
        />
      </DocsBlock>
      <DocsBlock section={section(page, 'package-managers')}>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-mono text-xs text-muted">
              <tr>
                {pmCols.map((c) => (
                  <th key={c.key} className="px-4 py-2 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packageManagers.map((pm) => (
                <tr key={pm.id} className="border-t border-line align-top">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{pm.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-soft">{pm.lockfile}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-soft">
                    {pm.disableScripts}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-soft">{pm.runApproved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <Md text={en.packageManagers.detectionNote} />{' '}
          <span className="sr-only">Detection order: {pmDetectionOrder.value.join(', ')}.</span>
        </p>
      </DocsBlock>
      <DocsBlock section={section(page, 'commands')}>
        <Snippet id="usage.commands" />
      </DocsBlock>
      <DocsBlock section={section(page, 'shell-init')}>
        <Snippet id="usage.shellInit" />
      </DocsBlock>
    </DocsShell>
  );
}
