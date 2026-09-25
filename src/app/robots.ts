import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: ['/', '/api/media/'],
      // Admin screens, raw API responses and per-device pages have nothing to rank.
      disallow: ['/admin', '/superadmin', '/api/', '/favorites', '/compare']
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
