import type { Metadata } from 'next';

import { en } from '@/content/en';
import type { DocsPage } from '@/content/types';

/** Docs pages in sidebar order. `slug` "" is the index. */
export const docsPages = [
  { slug: '', page: en.docs.index },
  { slug: 'getting-started', page: en.docs.gettingStarted },
  { slug: 'usage', page: en.docs.usage },
  { slug: 'policy', page: en.docs.policy },
  { slug: 'check-and-ci', page: en.docs.checkAndCi },
  { slug: 'monitor', page: en.docs.monitor },
  { slug: 'rules', page: en.docs.rules },
] as const satisfies readonly { slug: string; page: DocsPage }[];

export type DocsSlug = (typeof docsPages)[number]['slug'];

export function docsHref(slug: DocsSlug = ''): string {
  return `/docs/${slug ? `${slug}/` : ''}`;
}

export function docsMetadata(slug: DocsSlug, page: DocsPage): Metadata {
  const title = `${page.title} · safe-install docs`;
  return {
    title,
    description: page.description,
    alternates: { canonical: docsHref(slug) },
    openGraph: { type: 'website', title, description: page.description, url: docsHref(slug) },
  };
}
