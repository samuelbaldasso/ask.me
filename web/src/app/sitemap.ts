import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ask-me.company';

export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas que exigem login (/dashboard, /favorites, /login) ficam de fora:
  // não há valor em indexá-las e isso só desperdiça crawl budget.
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/sobre', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/buscar', priority: 0.9, changeFrequency: 'daily' },
    { path: '/ask', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/anuncie', priority: 0.7, changeFrequency: 'monthly' },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
