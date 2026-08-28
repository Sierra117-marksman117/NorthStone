import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site-url';
import {
  seedAgents,
  seedNeighborhoods,
  seedProperties,
} from '@/scripts/seed-data';

const RELEASE_DATE = '2026-08-28T00:00:00.000Z';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/properties', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/neighborhoods', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/agents', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteSiteUrl(route.path),
      lastModified: RELEASE_DATE,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...seedProperties.map((property) => ({
      url: absoluteSiteUrl(`/properties/${property.slug}`),
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      images: [
        absoluteSiteUrl(
          `/images/generated/properties/${property.slug}-1.webp`
        ),
      ],
    })),
    ...seedNeighborhoods.map((neighborhood) => ({
      url: absoluteSiteUrl(`/neighborhoods/${neighborhood.slug}`),
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...seedAgents.map((agent) => ({
      url: absoluteSiteUrl(`/agents/${agent.slug}`),
      lastModified: RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
