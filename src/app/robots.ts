import { MetadataRoute } from 'next';

/**
 * Robots.txt v142.0 - COMPLETE CRAWL MANAGEMENT
 * Directs Google crawlers to focus on public Blu Decor Padang content.
 * Blocks admin, API, auth, and internal routes from indexing.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/login',
          '/api/',
          '/review/',
          '/ai-visualizer',
          '/tentang',
          '/faq',
          '/kontak',
          '/_next/',
          '/favicon_io/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://bludecor.id/sitemap.xml',
  };
}