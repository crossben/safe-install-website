import { en } from '@/content/en';
import { exitCodes } from '@/content/facts';
import { DefTable, DocsBlock, DocsShell, Snippet, section } from '@/components/docs/Docs';
import { docsMetadata } from '@/lib/docsPages';

const page = en.docs.checkAndCi;
export const metadata = docsMetadata('check-and-ci', page);

export default function Page() {
  return (
    <DocsShell slug="check-and-ci" page={page}>
      <DocsBlock section={section(page, 'check')}>
        <Snippet id="check.commands" />
      </DocsBlock>
      <DocsBlock section={section(page, 'exit-codes')}>
        <DefTable
          head={['Code', 'Meaning']}
          rows={exitCodes.value.map((e) => [String(e.code), `${e.name}: ${e.description}`])}
        />
        <p className="mt-3 text-sm leading-relaxed text-muted">{en.ci.exitCodesNote}</p>
      </DocsBlock>
      <DocsBlock section={section(page, 'action')}>
        <Snippet id="ci.action" />
        <DefTable head={['Input', 'Meaning']} rows={page.inputs.map((i) => [i.name, i.meaning])} />
      </DocsBlock>
    </DocsShell>
  );
}
