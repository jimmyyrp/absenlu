import { MetadataRoute } from 'next';
import { getPostsForSitemap } from '@/lib/cms/service';

/**
 * Sitemap v142.0 - FULL SEO CRAWL MAP
 * Informs Google of complete architectural structure for accelerated indexing.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bludecor.id';
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: currentDate, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/layanan`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/portfolio`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bantuan`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/favorit`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const allPosts = await getPostsForSitemap();
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
    // Static routes are still returned
  }

  return [...staticRoutes, ...dynamicRoutes];
}