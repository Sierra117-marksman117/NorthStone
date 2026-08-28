import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro, PageShell } from '@/components/page-shell';
import { PropertyCard } from '@/components/property-card';
import { PropertyFilters } from '@/components/property-filters';
import { validatePropertyPriceFilters } from '@/lib/property-filter-validation';
import {
  getPublicNeighborhoods,
  searchPublicProperties,
} from '@/services/public-data.service';
import type { PropertyPurpose, PropertyType } from '@/types';
import type { PropertySort } from '@/types/public';

export const metadata: Metadata = {
  title: 'Properties',
  description: 'Browse Northstone’s illustrative collection of homes to buy and rent across Mumbai.',
};

const PURPOSES = new Set<PropertyPurpose>(['BUY', 'RENT']);
const TYPES = new Set<PropertyType>([
  'PENTHOUSE', 'VILLA', 'MANSION', 'ESTATE', 'APARTMENT', 'TOWNHOUSE', 'STUDIO', 'COMMERCIAL',
]);
const SORTS = new Set<PropertySort>(['newest', 'price-asc', 'price-desc']);

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function positiveNumber(raw?: string) {
  const parsed = raw ? Number(raw) : undefined;
  return parsed && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const purposeRaw = value(params, 'purpose');
  const typeRaw = value(params, 'propertyType');
  const sortRaw = value(params, 'sort');
  const neighborhood = value(params, 'neighborhood');
  const minPriceRaw = value(params, 'minPrice') ?? '';
  const maxPriceRaw = value(params, 'maxPrice') ?? '';
  const bedrooms = positiveNumber(value(params, 'bedrooms'));
  const page = positiveNumber(value(params, 'page')) ?? 1;
  const purpose = PURPOSES.has(purposeRaw as PropertyPurpose) ? (purposeRaw as PropertyPurpose) : undefined;
  const propertyType = TYPES.has(typeRaw as PropertyType) ? (typeRaw as PropertyType) : undefined;
  const sort = SORTS.has(sortRaw as PropertySort) ? (sortRaw as PropertySort) : 'newest';
  const priceErrors = validatePropertyPriceFilters({
    purpose: purpose ?? '',
    minPrice: minPriceRaw,
    maxPrice: maxPriceRaw,
  });
  const minPrice =
    !priceErrors.minPrice && minPriceRaw ? Number(minPriceRaw) : undefined;
  const maxPrice =
    !priceErrors.maxPrice && maxPriceRaw ? Number(maxPriceRaw) : undefined;

  const [result, neighborhoods] = await Promise.all([
    searchPublicProperties({
      purpose, propertyType, neighborhood, minPrice, maxPrice, bedrooms, sort, page, limit: 9,
    }),
    getPublicNeighborhoods(),
  ]);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
      const first = Array.isArray(raw) ? raw[0] : raw;
      if (first && key !== 'page') next.set(key, first);
    }
    next.set('page', String(target));
    return '/properties?' + next.toString();
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Property discovery"
        title="A focused collection of Mumbai homes."
        copy="Search by the essentials, then explore each residence with the context needed to make a confident next step."
      />
      <section className="listing-section">
        <div className="container-wide listing-layout">
          <aside className="filters-panel">
            <PropertyFilters
              neighborhoods={neighborhoods}
              initial={{
                purpose,
                neighborhood,
                propertyType,
                minPrice: minPriceRaw,
                maxPrice: maxPriceRaw,
                bedrooms,
                sort,
              }}
            />
          </aside>
          <div className="listing-results">
            <div className="results-heading"><p>{result.total} {result.total === 1 ? 'property' : 'properties'}</p><span>Illustrative asking prices</span></div>
            {result.properties.length ? (
              <div className="property-grid">
                {result.properties.map((property, index) => <PropertyCard key={property.id} property={property} priority={index < 2} />)}
              </div>
            ) : (
              <div className="empty-state">
                <p className="eyebrow">No matching homes</p>
                <h2>Try widening one of your filters.</h2>
                <Link href="/properties">View the complete collection</Link>
              </div>
            )}
            {result.totalPages > 1 ? (
              <nav className="pagination" aria-label="Property pages">
                {result.page > 1 ? <Link href={pageHref(result.page - 1)}>Previous</Link> : <span />}
                <span>Page {result.page} of {result.totalPages}</span>
                {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)}>Next</Link> : <span />}
              </nav>
            ) : null}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
