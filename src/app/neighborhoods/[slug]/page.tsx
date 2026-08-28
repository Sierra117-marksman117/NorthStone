import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { PropertyCard } from '@/components/property-card';
import { formatInrAmount } from '@/lib/utils';
import {
  getPublicNeighborhoodBySlug,
  getPublicNeighborhoodSlugs,
} from '@/services/public-data.service';

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicNeighborhoodSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const neighborhood = await getPublicNeighborhoodBySlug((await params).slug);
  return neighborhood
    ? { title: 'Properties in ' + neighborhood.name, description: neighborhood.summary.slice(0, 155) }
    : { title: 'Neighborhood not found' };
}

function Band({ title, band, suffix = '' }: { title: string; band: { minimum: number; maximum: number; median: number }; suffix?: string }) {
  return (
    <div className="price-band">
      <span>{title}</span>
      <strong>{formatInrAmount(band.median)}{suffix}</strong>
      <p>{formatInrAmount(band.minimum)} – {formatInrAmount(band.maximum)}{suffix}</p>
    </div>
  );
}

export default async function NeighborhoodDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const neighborhood = await getPublicNeighborhoodBySlug((await params).slug);
  if (!neighborhood) notFound();
  return (
    <PageShell>
      <section className="neighborhood-detail-hero">
        {neighborhood.hero ? <Image src={neighborhood.hero.url} alt={neighborhood.hero.alt} fill preload sizes="100vw" /> : null}
        <div className="hero-wash" />
        <div className="container neighborhood-detail-title">
          <p className="eyebrow light">{neighborhood.city}</p>
          <h1>{neighborhood.name}</h1>
        </div>
      </section>
      <section className="content-section neighborhood-story">
        <div className="container story-grid">
          <div><p className="eyebrow">At a glance</p><h2>A local point of view.</h2></div>
          <div><p className="story-lead">{neighborhood.summary}</p><ul>{neighborhood.lifestyleHighlights.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </section>
      {(neighborhood.buyPrices || neighborhood.rentPrices) ? (
        <section className="market-strip">
          <div className="container">
            <div><p className="eyebrow">Illustrative market view</p><h2>Asking prices in this collection</h2><p>Derived only from the published Northstone reference listings, not a market valuation.</p></div>
            <div className="price-bands">
              {neighborhood.buyPrices ? <Band title="For sale · median" band={neighborhood.buyPrices} /> : null}
              {neighborhood.rentPrices ? <Band title="For rent · median" band={neighborhood.rentPrices} suffix=" / month" /> : null}
            </div>
          </div>
        </section>
      ) : null}
      <section className="content-section">
        <div className="container-wide section-heading"><div><p className="eyebrow">Available now</p><h2>Properties in {neighborhood.name}</h2></div></div>
        {neighborhood.properties.length ? <div className="container-wide property-grid">{neighborhood.properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="container empty-state"><h2>No published properties at present.</h2></div>}
      </section>
    </PageShell>
  );
}
