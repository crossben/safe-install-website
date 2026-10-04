import { en } from '@/content/en';
import { DocsBlock, DocsShell, Snippet, section } from '@/components/docs/Docs';
import { docsMetadata } from '@/lib/docsPages';

const page = en.docs.gettingStarted;
export const metadata = docsMetadata('getting-started', page);

export default function Page() {
  return (
    <DocsShell slug="getting-started" page={page}>
      <DocsBlock section={section(page, 'install')}>
        <Snippet id="install.channels" />
      </DocsBlock>
      <DocsBlock section={section(page, 'verify')}>
        <Snippet id="install.verify" />
      </DocsBlock>
      <DocsBlock section={section(page, 'first-run')}>
        <Snippet id="usage.install" />
      </DocsBlock>
    </DocsShell>
  );
}
