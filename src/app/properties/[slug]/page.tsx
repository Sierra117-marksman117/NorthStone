import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { PropertyCard } from '@/components/property-card';
import {
  PreviewEnquiryForm,
  PreviewSaveButton,
  PreviewVisitForm,
} from '@/components/preview-property-actions';
import { ShareButton } from '@/components/share-button';
import { StructuredData } from '@/components/structured-data';
import { absoluteSiteUrl } from '@/lib/site-url';
import { formatInrAmount } from '@/lib/utils';
import {
  getPublicPropertyBySlug,
  getPublicPropertySlugs,
} from '@/services/public-data.service';

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicPropertySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) return { title: 'Property not found' };
  return {
    title: property.title,
    description: property.headline || property.description.slice(0, 155),
    openGraph: property.image ? { images: [property.image.url] } : undefined,
  };
}

function label(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPublicPropertyBySlug(slug);
  if (!property) notFound();

  const propertyStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: property.title,
    description: property.description,
    url: absoluteSiteUrl(`/properties/${property.slug}`),
    image: property.images.map((image) => absoluteSiteUrl(image.url)),
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.neighborhood,
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
    numberOfRooms: property.bedrooms,
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'Reference data status',
      value: 'Illustrative — not a live property listing',
    },
  };

  return (
    <PageShell>
      <StructuredData data={propertyStructuredData} />
      <section className="property-detail-head">
        <div className="container-wide">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/properties">Properties</Link><span>/</span><span>{property.neighborhood}</span>
          </nav>
          <div className="property-title-row">
            <div>
              <p className="eyebrow">{property.purpose === 'BUY' ? 'For sale' : 'For rent'} · {label(property.status)}</p>
              <h1>{property.title}</h1>
              <p>{property.neighborhood}, {property.city}</p>
            </div>
            <div className="property-price">
              <strong>{formatInrAmount(property.priceAmount)}</strong>
              {property.purpose === 'RENT' ? <span>per month</span> : <span>illustrative asking price</span>}
              <ShareButton title={property.title} />
              <PreviewSaveButton propertySlug={property.slug} />
            </div>
          </div>
        </div>
      </section>

      <section className="property-gallery container-wide">
        {property.images.map((image, index) => (
          <div key={image.url} className={index === 0 ? 'gallery-main' : 'gallery-side'}>
            <Image src={image.url} alt={image.alt} fill sizes={index === 0 ? '(max-width: 800px) 100vw, 66vw' : '(max-width: 800px) 100vw, 34vw'} loading="eager" />
          </div>
        ))}
      </section>

      <section className="property-overview">
        <div className="container-wide property-overview-grid">
          <div className="property-main">
            <div className="detail-facts">
              <div><strong>{property.bedrooms}</strong><span>Bedrooms</span></div>
              <div><strong>{property.bathrooms}</strong><span>Bathrooms</span></div>
              <div><strong>{property.areaSqFt?.toLocaleString('en-IN') ?? '—'}</strong><span>Primary area · sq ft</span></div>
              <div><strong>{label(property.status)}</strong><span>Availability</span></div>
            </div>
            <div className="editorial-copy">
              <p className="eyebrow">The residence</p>
              <h2>{property.headline}</h2>
              <p>{property.description}</p>
            </div>
            <div className="spec-grid">
              <div><span>Property type</span><strong>{label(property.propertyType)}</strong></div>
              <div><span>Furnishing</span><strong>{label(property.furnishing)}</strong></div>
              <div><span>Completion</span><strong>{label(property.completionStatus)}</strong></div>
              {property.builtUpAreaSqFt ? <div><span>Built-up area</span><strong>{property.builtUpAreaSqFt.toLocaleString('en-IN')} sq ft</strong></div> : null}
              {property.carpetAreaSqFt ? <div><span>Carpet area</span><strong>{property.carpetAreaSqFt.toLocaleString('en-IN')} sq ft</strong></div> : null}
              {property.plotAreaSqFt ? <div><span>Plot area</span><strong>{property.plotAreaSqFt.toLocaleString('en-IN')} sq ft</strong></div> : null}
            </div>
            {property.amenities.length ? (
              <div className="amenities-block">
                <p className="eyebrow">Amenities</p>
                <h2>Details that shape daily life.</h2>
                <ul>{property.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
              </div>
            ) : null}
          </div>
          <aside className="property-sidebar">
            {property.agent ? (
              <div className="advisor-panel">
                <p className="eyebrow">Your advisor</p>
                {property.agent.avatar ? <div className="advisor-panel-image"><Image src={property.agent.avatar.url} alt={property.agent.avatar.alt} fill sizes="280px" /></div> : null}
                <h2>{property.agent.name}</h2>
                <p>{property.agent.title}</p>
                <Link href={'/agents/' + property.agent.slug}>View advisor profile <span aria-hidden="true">→</span></Link>
              </div>
            ) : null}
            <div className="sidebar-enquiry">
              <p className="eyebrow">Ask about this home</p>
              <PreviewEnquiryForm propertySlug={property.slug} />
            </div>
          </aside>
        </div>
      </section>

      {property.neighborhoodDetails ? (
        <section className="neighborhood-feature">
          {property.neighborhoodDetails.hero ? <Image src={property.neighborhoodDetails.hero.url} alt={property.neighborhoodDetails.hero.alt} fill sizes="100vw" loading="eager" /> : null}
          <div className="neighborhood-feature-wash" />
          <div className="container neighborhood-feature-copy">
            <p className="eyebrow light">The neighborhood</p>
            <h2>{property.neighborhoodDetails.name}</h2>
            <p>{property.neighborhoodDetails.summary}</p>
            <Link href={'/neighborhoods/' + property.neighborhoodDetails.slug}>Explore {property.neighborhoodDetails.name} <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      ) : null}

      <section className="content-section visit-section">
        <div className="container form-feature-grid">
          <div><p className="eyebrow">Private appointments</p><h2>See the residence in your own time.</h2><p>Request a one-hour private appointment in person or by video. Times are shown in India Standard Time and confirmed by your advisor.</p></div>
          <PreviewVisitForm propertySlug={property.slug} />
        </div>
      </section>

      {property.similar.length ? (
        <section className="content-section similar-section">
          <div className="container-wide section-heading"><div><p className="eyebrow">Continue exploring</p><h2>Similar properties</h2></div><Link href="/properties">View all <span aria-hidden="true">→</span></Link></div>
          <div className="container-wide property-grid">{property.similar.map((item) => <PropertyCard key={item.id} property={item} />)}</div>
        </section>
      ) : null}
    </PageShell>
  );
}
