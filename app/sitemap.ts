import type { MetadataRoute } from 'next';

import { repo } from '@/content/facts';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${repo.value}`;
  const lastModified = new Date('2026-10-03');

  return [{ url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1 }];
}
