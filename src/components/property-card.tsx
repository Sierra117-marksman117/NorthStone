import Image from 'next/image';
import Link from 'next/link';
import { formatInrAmount } from '@/lib/utils';
import type { PublicPropertyCard } from '@/types/public';

export function PropertyCard({
  property,
  priority = false,
}: {
  property: PublicPropertyCard;
  priority?: boolean;
}) {
  return (
    <article className="property-card">
      <Link href={'/properties/' + property.slug} className="property-card-media">
        {property.image ? (
          <Image
            src={property.image.url}
            alt={property.image.alt}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <span className="media-placeholder">Northstone</span>
        )}
        <span className="property-purpose">
          {property.purpose === 'BUY' ? 'For sale' : 'For rent'}
        </span>
      </Link>
      <div className="property-card-body">
        <p>{property.neighborhood} · {property.city}</p>
        <h3>
          <Link href={'/properties/' + property.slug}>{property.title}</Link>
        </h3>
        <strong>
          {formatInrAmount(property.priceAmount)}
          {property.purpose === 'RENT' ? ' / month' : ''}
        </strong>
        <div className="property-facts">
          <span>{property.bedrooms} beds</span>
          <span>{property.bathrooms} baths</span>
          {property.areaSqFt ? (
            <span>{property.areaSqFt.toLocaleString('en-IN')} sq ft</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
