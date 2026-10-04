import { en } from '@/content/en';
import { DefTable, DocsBlock, DocsShell, Snippet, section } from '@/components/docs/Docs';
import { docsMetadata } from '@/lib/docsPages';

const page = en.docs.policy;
export const metadata = docsMetadata('policy', page);

export default function Page() {
  return (
    <DocsShell slug="policy" page={page}>
      <DocsBlock section={section(page, 'file')}>
        <Snippet id="policy.file" />
      </DocsBlock>
      <DocsBlock section={section(page, 'fields')}>
        <DefTable head={['Field', 'Meaning']} rows={page.fields.map((f) => [f.name, f.meaning])} />
      </DocsBlock>
      <DocsBlock section={section(page, 'approvals')} />
      <DocsBlock section={section(page, 'locations')}>
        <DefTable
          head={['File', 'Path']}
          mono={false}
          rows={page.locations.map((l) => [
            l.where,
            <code key={l.where} className="font-mono text-xs">
              {l.path}
            </code>,
          ])}
        />
      </DocsBlock>
      <DocsBlock section={section(page, 'release-age')} />
    </DocsShell>
  );
}
