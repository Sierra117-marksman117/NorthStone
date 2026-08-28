import Image from 'next/image';
import Link from 'next/link';
import type { PublicNeighborhoodCard } from '@/types/public';

export function NeighborhoodCard({
  neighborhood,
}: {
  neighborhood: PublicNeighborhoodCard;
}) {
  return (
    <article className="neighborhood-card">
      <Link
        href={'/neighborhoods/' + neighborhood.slug}
        className="neighborhood-card-media"
      >
        {neighborhood.hero ? (
          <Image
            src={neighborhood.hero.url}
            alt={neighborhood.hero.alt}
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        ) : (
          <span className="media-placeholder">Northstone</span>
        )}
        <div>
          <p>{neighborhood.city}</p>
          <h3>{neighborhood.name}</h3>
          <span>{neighborhood.propertyCount} available properties</span>
        </div>
      </Link>
    </article>
  );
}
