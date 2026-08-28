import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createPreviewSeed } from '@/lib/preview-data';
import { getSiteUrl } from '@/lib/site-url';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import {
  seedAgents,
  seedNeighborhoods,
  seedProperties,
} from '@/scripts/seed-data';
import {
  getPublicAgentBySlug,
  getPublicNeighborhoodBySlug,
  getPublicPropertyBySlug,
} from '@/services/public-data.service';

let passed = 0;

function test(name: string, assertion: () => void) {
  assertion();
  passed += 1;
  console.log(`✓ ${name}`);
}

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const preview = createPreviewSeed();

test('site URL ignores blank or malformed deployment values', () => {
  const keys = [
    'NEXT_PUBLIC_SITE_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
    'VERCEL_URL',
  ] as const;
  const original = new Map(keys.map((key) => [key, process.env[key]]));

  try {
    process.env.NEXT_PUBLIC_SITE_URL = '   ';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'not a valid URL';
    process.env.VERCEL_URL = 'northstone-release.vercel.app';
    assert.equal(
      getSiteUrl().toString(),
      'https://northstone-release.vercel.app/'
    );

    process.env.VERCEL_URL = '';
    assert.equal(getSiteUrl().toString(), 'http://localhost:3000/');
  } finally {
    for (const key of keys) {
      const value = original.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('preview property prices, statuses, purposes, and details match the release seed', () => {
  assert.equal(preview.properties.length, seedProperties.length);
  for (const definition of seedProperties) {
    const property = preview.properties.find((item) => item.slug === definition.slug);
    assert.ok(property, `Missing preview property ${definition.slug}`);
    assert.equal(property.priceAmount, definition.priceAmount);
    assert.equal(property.status, definition.status);
    assert.equal(property.purpose, definition.purpose);
    assert.equal(property.propertyType, definition.propertyType);
    assert.equal(property.title, definition.title);
    assert.equal(property.headline, definition.headline);
    assert.equal(property.bedrooms, definition.bedrooms);
    assert.equal(property.bathrooms, definition.bathrooms);
    assert.equal(property.neighborhood, definition.address.neighborhood);
    assert.deepEqual(property.amenities, definition.amenities);
    assert.equal(property.agentId, `agent-${definition.agentSlug}`);
    assert.equal(property.neighborhoodId, `neighborhood-${definition.neighborhoodSlug}`);
  }
});

test('public property details are generated from the same immutable seed', () => {
  for (const definition of seedProperties) {
    const property = getPublicPropertyBySlug(definition.slug);
    assert.ok(property, `Missing public property ${definition.slug}`);
    assert.equal(property.priceAmount, definition.priceAmount);
    assert.equal(property.status, definition.status);
    assert.equal(property.description, definition.description);
    assert.deepEqual(property.amenities, definition.amenities);
    assert.equal(property.images.length, 3);
    assert.ok(property.images.every((image) => image.url.endsWith('.webp')));
  }
});

test('public agents and neighborhoods retain seeded relationships and details', () => {
  for (const definition of seedAgents) {
    const agent = getPublicAgentBySlug(definition.slug);
    assert.ok(agent, `Missing public agent ${definition.slug}`);
    assert.equal(agent.name, definition.name);
    assert.deepEqual(agent.languages, definition.languages);
    assert.ok(agent.properties.every((property) =>
      seedProperties.some(
        (item) => item.slug === property.slug && item.agentSlug === definition.slug
      )
    ));
  }
  for (const definition of seedNeighborhoods) {
    const neighborhood = getPublicNeighborhoodBySlug(definition.slug);
    assert.ok(neighborhood, `Missing neighborhood ${definition.slug}`);
    assert.equal(neighborhood.summary, definition.editorialSummary);
    assert.ok(neighborhood.properties.every((property) =>
      seedProperties.some(
        (item) => item.slug === property.slug && item.neighborhoodSlug === definition.slug
      )
    ));
  }
});

test('preview runtime and public demo sources have no database or server-action dependency', () => {
  const guardedFiles = [
    'src/components/preview-store.tsx',
    'src/components/preview-property-actions.tsx',
    'src/components/portal-pages.tsx',
    'src/components/operations-pages.tsx',
    'src/lib/preview-data.ts',
    'src/services/public-data.service.ts',
    'src/app/contact/page.tsx',
    'src/app/agents/[slug]/page.tsx',
    'src/app/properties/[slug]/page.tsx',
  ];
  const forbidden = [
    '@/app/actions',
    '@/lib/mongodb',
    '@/models/',
    'mongoose',
    'mongodb',
    'submitLead',
    'submitVisit',
    'fetch(',
  ];
  for (const relativePath of guardedFiles) {
    const contents = source(relativePath).toLowerCase();
    for (const token of forbidden) {
      assert.equal(
        contents.includes(token.toLowerCase()),
        false,
        `${relativePath} contains forbidden runtime token ${token}`
      );
    }
  }
});

test('quick links expose the public site, Customer Portal, and Operations Console', () => {
  const quickLinkSources = [
    source('src/app/page.tsx'),
    source('src/components/site-footer.tsx'),
    source('src/components/preview-shell.tsx'),
  ].join('\n');
  assert.match(quickLinkSources, /href="\/properties"/);
  assert.match(quickLinkSources, /href="\/portal"/);
  assert.match(quickLinkSources, /href="\/operations"/);
});

test('sitemap contains every public detail route and excludes preview routes', () => {
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.equal(urls.includes('/portal'), false);
  assert.equal(urls.includes('/operations'), false);
  for (const property of seedProperties) {
    assert.ok(urls.includes(`/properties/${property.slug}`));
  }
  for (const agent of seedAgents) assert.ok(urls.includes(`/agents/${agent.slug}`));
  for (const neighborhood of seedNeighborhoods) {
    assert.ok(urls.includes(`/neighborhoods/${neighborhood.slug}`));
  }
});

test('robots and route metadata keep all preview and protected routes out of the index', () => {
  const rules = robots().rules;
  assert.equal(Array.isArray(rules), false);
  if (Array.isArray(rules)) throw new Error('Unexpected robots rule array');
  const disallowed = Array.isArray(rules.disallow)
    ? rules.disallow
    : [rules.disallow];
  for (const pathname of ['/portal/', '/operations/', '/admin/', '/dashboard/']) {
    assert.ok(disallowed.includes(pathname));
  }
  for (const layout of [
    source('src/app/portal/layout.tsx'),
    source('src/app/operations/layout.tsx'),
  ]) {
    assert.match(layout, /index:\s*false/);
    assert.match(layout, /follow:\s*false/);
  }
});

test('every referenced release image is WebP and no superseded PNG remains', () => {
  const imageRoot = path.join(process.cwd(), 'public', 'images');
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else files.push(target);
    }
  };
  walk(imageRoot);
  assert.equal(files.some((file) => file.toLowerCase().endsWith('.png')), false);
  assert.equal(files.filter((file) => file.endsWith('.webp')).length, 40);
  for (const property of preview.properties) {
    for (const media of property.media) {
      assert.ok(
        fs.existsSync(
          path.join(process.cwd(), 'public', media.url.replace(/^\//, ''))
        )
      );
    }
  }
});

test('public forms are browser-local and disclosures are present across experiences', () => {
  assert.doesNotMatch(source('src/app/contact/page.tsx'), /LeadForm/);
  assert.doesNotMatch(source('src/app/agents/[slug]/page.tsx'), /LeadForm/);
  assert.match(source('src/components/site-footer.tsx'), /Illustrative reference build/);
  assert.match(source('src/components/preview-shell.tsx'), /Reference preview/);
  assert.match(source('src/components/preview-property-actions.tsx'), /No message is sent/);
});

console.log(`\n${passed} release assertions passed.`);
