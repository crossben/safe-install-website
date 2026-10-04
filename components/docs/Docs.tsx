/**
 * The docs pages (/docs/…): static, server-rendered, no animation. Commands come
 * from the CLI README via lib/docs.ts, prose from content/en.ts (`docs`).
 */
import type { ReactNode } from 'react';

import { en } from '@/content/en';
import { repo } from '@/content/facts';
import type { DocsPage, DocsSection } from '@/content/types';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { docSnippet, type DocSnippetId } from '@/lib/docs';
import { highlight } from '@/lib/highlight';
import { docsHref, docsPages, type DocsSlug } from '@/lib/docsPages';

/** Renders `code` spans in a prose string. */
export function Md({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Sidebar({ slug }: { slug: DocsSlug }) {
  return (
    <nav aria-label={en.docs.navLabel} className="lg:sticky lg:top-24">
      <ul className="flex flex-wrap gap-1 lg:flex-col lg:gap-0.5">
        {docsPages.map((p) => (
          <li key={p.slug}>
            <a
              href={docsHref(p.slug)}
              aria-current={p.slug === slug ? 'page' : undefined}
              className="block rounded-md px-3 py-1.5 font-mono text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-ink aria-[current=page]:bg-surface-2 aria-[current=page]:text-accent"
            >
              {p.page.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DocsShell({
  slug,
  page,
  children,
}: {
  slug: DocsSlug;
  page: DocsPage;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div className="shell grid grid-cols-[minmax(0,1fr)] gap-10 py-10 sm:py-14 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="border-b border-line pb-6 lg:border-b-0 lg:pb-0">
          <p className="px-3 font-mono text-xs tracking-[0.18em] text-accent uppercase">
            {en.docs.navLabel}
          </p>
          <div className="mt-3">
            <Sidebar slug={slug} />
          </div>
        </aside>
        <main id="main" className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            <Md text={page.description} />
          </p>
          <div className="mt-10 flex max-w-3xl flex-col gap-12">{children}</div>
          <p className="mt-16 max-w-3xl border-t border-line pt-4 font-mono text-xs text-muted">
            <a
              href={`https://${repo.value}/issues`}
              className="underline decoration-accent underline-offset-4 hover:text-ink"
            >
              {en.docs.editLabel}
            </a>
          </p>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

/** A section: heading with anchor, prose paragraphs, then any extra content. */
export function DocsBlock({ section, children }: { section: DocsSection; children?: ReactNode }) {
  return (
    <section aria-labelledby={section.id}>
      <h2 id={section.id} className="scroll-mt-24 text-xl font-semibold tracking-tight">
        <a href={`#${section.id}`} className="hover:text-accent">
          {section.title}
        </a>
      </h2>
      {section.body.map((p, i) => (
        <p key={i} className="mt-3 leading-relaxed text-ink-soft">
          <Md text={p} />
        </p>
      ))}
      {children}
    </section>
  );
}

/** A verbatim README code block. */
export async function Snippet({ id }: { id: DocSnippetId }) {
  const snippet = docSnippet(id);
  const html = await highlight(snippet.code, snippet.lang);
  return (
    <div className="mt-4">
      <CodeBlock
        html={html}
        code={snippet.code}
        label={`${snippet.source} · ${en.docs.sourceLabel}`}
      />
    </div>
  );
}

/** A two-column definition table. */
export function DefTable({
  head,
  rows,
  mono = true,
}: {
  head: readonly [string, string];
  rows: readonly (readonly [ReactNode, ReactNode])[];
  mono?: boolean;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2 font-mono text-xs text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{head[0]}</th>
            <th className="px-4 py-2 font-medium">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b], i) => (
            <tr key={i} className="border-t border-line align-top">
              <td
                className={`px-4 py-2.5 whitespace-nowrap text-ink ${mono ? 'font-mono text-xs' : ''}`}
              >
                {a}
              </td>
              <td className="px-4 py-2.5 leading-relaxed text-ink-soft">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function section(page: DocsPage, id: string): DocsSection {
  const s = page.sections.find((x) => x.id === id);
  if (!s) throw new Error(`[docs] no section "${id}" in "${page.title}"`);
  return s;
}
