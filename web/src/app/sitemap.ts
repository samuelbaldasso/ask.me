import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/sobre', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/buscar', priority: 0.9, changeFrequency: 'daily' },
    { path: '/ask', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/anuncie', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/favorites', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/dashboard', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.2, changeFrequency: 'yearly' },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
