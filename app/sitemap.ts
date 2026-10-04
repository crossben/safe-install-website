import type { MetadataRoute } from 'next';

import { repo } from '@/content/facts';
import { docsHref, docsPages } from '@/lib/docsPages';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${repo.value}`;
  const lastModified = new Date('2026-10-04');

  return [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    ...docsPages.map((p) => ({
      url: `${base}${docsHref(p.slug)}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
