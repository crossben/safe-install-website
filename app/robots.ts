import type { MetadataRoute } from 'next';

import { repo } from '@/content/facts';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `https://${repo.value}/sitemap.xml`,
    host: `https://${repo.value}`,
  };
}
