import { MetadataRoute } from 'next';
import { supabaseSafe } from '@/lib/supabase';

/**
 * Sitemap v142.0 - FULL SEO CRAWL MAP
 * Informs Google of complete architectural structure for accelerated indexing.
 * Includes static pages, dynamic portfolio items, and service detail pages.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bludecor.id';
  const currentDate = new Date();

  // Static pages with SEO-optimized priorities
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: currentDate, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/layanan`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/portfolio`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bantuan`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/favorit`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Fetch dynamic posts for portfolio and layanan detail pages
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  if (supabaseSafe) {
    try {
      const pageSize = 1000;
      let from = 0;
      let allPosts: { id: number; updated_at: string; created_at: string }[] = [];
      for (;;) {
        const { data: batch } = await supabaseSafe
          .from('posts')
          .select('id, updated_at, created_at')
          .is('deleted_at', null)
          .order('id')
          .range(from, from + pageSize - 1);
        if (batch && batch.length > 0) {
          allPosts = allPosts.concat(batch);
          if (batch.length < pageSize) break;
          from += pageSize;
        } else {
          break;
        }
      }

      if (allPosts.length > 0) {
        dynamicRoutes = allPosts.flatMap((post) => [
          {
            url: `${baseUrl}/portfolio/${post.id}`,
            lastModified: new Date(post.updated_at || post.created_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          },
          {
            url: `${baseUrl}/layanan/${post.id}`,
            lastModified: new Date(post.updated_at || post.created_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          },
        ]);
      }
    } catch {
      // Silently fail - static routes are still returned
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}