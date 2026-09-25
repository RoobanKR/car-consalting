import type { MetadataRoute } from 'next';
import { carHref } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { listSitemapCars } from '@/lib/server/data';

// Rebuilt at most once an hour so new listings reach Google without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/cars'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/feedback'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 }
  ];
  const cars = await listSitemapCars().catch(() => []);
  return [...pages, ...cars.map(car => ({
    url: absoluteUrl(carHref(car)),
    lastModified: car.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: car.images.slice(0, 5).map(url => absoluteUrl(url))
  }))];
}
