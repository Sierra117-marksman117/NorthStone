import assert from 'node:assert/strict';
import {
  seedAgents,
  seedNeighborhoods,
  seedProperties,
} from '@/scripts/seed-data';

const rawBaseUrl = process.argv[2];
if (!rawBaseUrl) {
  throw new Error('Usage: npm run crawl:release -- https://deployment.example');
}

const baseUrl = new URL(rawBaseUrl);
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/properties',
  '/agents',
  '/neighborhoods',
  '/privacy',
  '/terms',
  ...seedProperties.map((property) => `/properties/${property.slug}`),
  ...seedAgents.map((agent) => `/agents/${agent.slug}`),
  ...seedNeighborhoods.map((neighborhood) => `/neighborhoods/${neighborhood.slug}`),
];
const previewRoutes = [
  '/portal',
  '/portal/saved',
  '/portal/enquiries',
  '/portal/visits',
  '/portal/notifications',
  '/portal/profile',
  '/operations',
  '/operations/properties',
  '/operations/properties/new',
  `/operations/properties/property-${seedProperties[0]?.slug}`,
  '/operations/agents',
  '/operations/leads',
  '/operations/visits',
  '/operations/neighborhoods',
];

async function html(pathname: string) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: 'follow',
    headers: { 'user-agent': 'NorthstoneReleaseCrawler/1.0' },
  });
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  const body = await response.text();
  assert.match(body, /<title>[^<]+<\/title>/i, `${pathname} has no title`);
  return body;
}

async function main() {
  for (const pathname of publicRoutes) {
    const body = await html(pathname);
    assert.doesNotMatch(
      body,
      /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i,
      `${pathname} is unexpectedly noindex`
    );
  }

  for (const pathname of previewRoutes) {
    const body = await html(pathname);
    assert.match(body, /noindex/i, `${pathname} is missing noindex`);
    assert.match(body, /Reference preview/i, `${pathname} is missing disclosure`);
  }

  const robotsResponse = await fetch(new URL('/robots.txt', baseUrl));
  assert.equal(robotsResponse.status, 200);
  const robotsBody = await robotsResponse.text();
  assert.match(robotsBody, /Disallow: \/portal\//);
  assert.match(robotsBody, /Disallow: \/operations\//);

  const sitemapResponse = await fetch(new URL('/sitemap.xml', baseUrl));
  assert.equal(sitemapResponse.status, 200);
  const sitemapBody = await sitemapResponse.text();
  assert.doesNotMatch(sitemapBody, /\/portal|\/operations/);
  for (const property of seedProperties) {
    assert.match(sitemapBody, new RegExp(`/properties/${property.slug}`));
  }

  console.log(
    `Fresh crawl passed: ${publicRoutes.length + previewRoutes.length} HTML routes plus robots.txt and sitemap.xml.`
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
