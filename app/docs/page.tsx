import { en } from '@/content/en';
import { DocsShell } from '@/components/docs/Docs';
import { docsHref, docsMetadata, docsPages } from '@/lib/docsPages';

const page = en.docs.index;
export const metadata = docsMetadata('', page);

export default function Page() {
  return (
    <DocsShell slug="" page={page}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {docsPages
          .filter((p) => p.slug !== '')
          .map((p) => (
            <li key={p.slug}>
              <a
                href={docsHref(p.slug)}
                className="block h-full rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent"
              >
                <h2 className="font-semibold tracking-tight">{p.page.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.page.description}</p>
              </a>
            </li>
          ))}
      </ul>
    </DocsShell>
  );
}
