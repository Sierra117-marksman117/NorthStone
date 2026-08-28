import {
  seedAgents,
  seedNeighborhoods,
  seedProperties,
  type SeedAgentDefinition,
  type SeedNeighborhoodDefinition,
  type SeedPropertyDefinition,
} from '@/scripts/seed-data';
import type {
  AskingPriceBand,
  PublicAgentCard,
  PublicAgentDetail,
  PublicMedia,
  PublicNeighborhoodCard,
  PublicNeighborhoodDetail,
  PublicPropertyCard,
  PublicPropertyDetail,
  PublicPropertySearch,
  PublicPropertySearchResult,
} from '@/types/public';

const PROPERTY_IMAGE_SIZE = { width: 1586, height: 992 } as const;
const AGENT_IMAGE_SIZE = { width: 1122, height: 1402 } as const;
const NEIGHBORHOOD_IMAGE_SIZE = { width: 1634, height: 963 } as const;

const propertyOrder = new Map(
  seedProperties.map((property, index) => [property.slug, index])
);

function propertyId(slug: string) {
  return `property-${slug}`;
}

function agentId(slug: string) {
  return `agent-${slug}`;
}

function neighborhoodId(slug: string) {
  return `neighborhood-${slug}`;
}

function propertyMedia(
  property: SeedPropertyDefinition,
  mediaIndex: number
): PublicMedia {
  return {
    url: `/images/generated/properties/${property.slug}-${mediaIndex + 1}.webp`,
    alt: property.imageAlts[mediaIndex] ?? property.title,
    ...PROPERTY_IMAGE_SIZE,
  };
}

function propertyCard(
  property: SeedPropertyDefinition
): PublicPropertyCard {
  return {
    id: propertyId(property.slug),
    title: property.title,
    slug: property.slug,
    purpose: property.purpose,
    propertyType: property.propertyType,
    status: property.status,
    priceAmount: property.priceAmount,
    rentPeriod: property.rentPeriod,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqFt:
      property.carpetAreaSqFt ??
      property.builtUpAreaSqFt ??
      property.plotAreaSqFt ??
      null,
    neighborhood: property.address.neighborhood,
    city: property.address.city,
    image: propertyMedia(property, 0),
  };
}

function agentCard(agent: SeedAgentDefinition): PublicAgentCard {
  return {
    id: agentId(agent.slug),
    name: agent.name,
    slug: agent.slug,
    title: agent.title,
    avatar: {
      url: `/images/generated/agents/${agent.slug}.webp`,
      alt: agent.avatarAlt,
      ...AGENT_IMAGE_SIZE,
    },
    specializations: [...agent.specializations],
  };
}

function neighborhoodCard(
  neighborhood: SeedNeighborhoodDefinition,
  propertyCount = 0
): PublicNeighborhoodCard {
  return {
    id: neighborhoodId(neighborhood.slug),
    name: neighborhood.name,
    slug: neighborhood.slug,
    city: neighborhood.city,
    summary: neighborhood.editorialSummary,
    hero: {
      url: `/images/generated/neighborhoods/${neighborhood.slug}.webp`,
      alt: neighborhood.heroAlt,
      ...NEIGHBORHOOD_IMAGE_SIZE,
    },
    propertyCount,
  };
}

function priceBand(values: number[]): AskingPriceBand | null {
  if (!values.length) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const minimum = sorted[0];
  const maximum = sorted.at(-1);
  if (minimum === undefined || maximum === undefined) return null;
  const midpoint = Math.floor(sorted.length / 2);
  const middle = sorted[midpoint];
  if (middle === undefined) return null;
  const lower = sorted[midpoint - 1];
  const median =
    sorted.length % 2 === 0 && lower !== undefined
      ? Math.round((lower + middle) / 2)
      : middle;
  return { minimum, maximum, median };
}

function curatedOrder(
  first: SeedPropertyDefinition,
  second: SeedPropertyDefinition
) {
  const featuredDifference = Number(second.isFeatured) - Number(first.isFeatured);
  if (featuredDifference) return featuredDifference;
  return (
    (propertyOrder.get(first.slug) ?? Number.MAX_SAFE_INTEGER) -
    (propertyOrder.get(second.slug) ?? Number.MAX_SAFE_INTEGER)
  );
}

export function getPublicPropertySlugs() {
  return seedProperties.map((property) => property.slug);
}

export function getPublicAgentSlugs() {
  return seedAgents.map((agent) => agent.slug);
}

export function getPublicNeighborhoodSlugs() {
  return seedNeighborhoods.map((neighborhood) => neighborhood.slug);
}

export function getFeaturedPublicProperties(limit = 5) {
  return seedProperties
    .filter((property) => property.isPublished && property.isFeatured)
    .sort(curatedOrder)
    .slice(0, limit)
    .map(propertyCard);
}

export function searchPublicProperties(
  input: PublicPropertySearch
): PublicPropertySearchResult {
  const matches = seedProperties
    .filter((property) => property.isPublished)
    .filter((property) => !input.purpose || property.purpose === input.purpose)
    .filter(
      (property) =>
        !input.propertyType || property.propertyType === input.propertyType
    )
    .filter(
      (property) => !input.bedrooms || property.bedrooms >= input.bedrooms
    )
    .filter(
      (property) =>
        !input.minPrice || property.priceAmount >= input.minPrice
    )
    .filter(
      (property) =>
        !input.maxPrice || property.priceAmount <= input.maxPrice
    )
    .filter(
      (property) =>
        !input.neighborhood || property.neighborhoodSlug === input.neighborhood
    )
    .sort((first, second) => {
      if (input.sort === 'price-asc') {
        return first.priceAmount - second.priceAmount || curatedOrder(first, second);
      }
      if (input.sort === 'price-desc') {
        return second.priceAmount - first.priceAmount || curatedOrder(first, second);
      }
      return curatedOrder(first, second);
    });

  const total = matches.length;
  const start = (input.page - 1) * input.limit;
  return {
    properties: matches.slice(start, start + input.limit).map(propertyCard),
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
  };
}

export function getPublicPropertyBySlug(
  slug: string
): PublicPropertyDetail | null {
  const property = seedProperties.find(
    (item) => item.slug === slug && item.isPublished
  );
  if (!property) return null;
  const agent = seedAgents.find(
    (item) => item.slug === property.agentSlug && item.isActive
  );
  const neighborhood = seedNeighborhoods.find(
    (item) => item.slug === property.neighborhoodSlug && item.isPublished
  );
  const similar = seedProperties
    .filter(
      (item) =>
        item.slug !== property.slug &&
        item.isPublished &&
        (item.neighborhoodSlug === property.neighborhoodSlug ||
          item.propertyType === property.propertyType)
    )
    .sort(curatedOrder)
    .slice(0, 3)
    .map(propertyCard);

  return {
    ...propertyCard(property),
    headline: property.headline,
    description: property.description,
    powderRooms: property.powderRooms,
    builtUpAreaSqFt: property.builtUpAreaSqFt,
    carpetAreaSqFt: property.carpetAreaSqFt ?? null,
    plotAreaSqFt: property.plotAreaSqFt ?? null,
    furnishing: property.furnishing,
    completionStatus: property.completionStatus,
    amenities: [...property.amenities],
    images: property.imageAlts.map((_, index) => propertyMedia(property, index)),
    agent: agent
      ? {
          ...agentCard(agent),
          email: agent.email,
          phone: agent.phone,
          bio: agent.bio,
        }
      : null,
    neighborhoodDetails: neighborhood
      ? {
          ...neighborhoodCard(
            neighborhood,
            seedProperties.filter(
              (item) =>
                item.isPublished && item.neighborhoodSlug === neighborhood.slug
            ).length
          ),
          lifestyleHighlights: [...neighborhood.lifestyleHighlights],
        }
      : null,
    similar,
  };
}

export function getPublicAgents() {
  return seedAgents
    .filter((agent) => agent.isActive)
    .sort(
      (first, second) =>
        Number(second.isFeatured) - Number(first.isFeatured) ||
        first.name.localeCompare(second.name)
    )
    .map(agentCard);
}

export function getPublicAgentBySlug(slug: string): PublicAgentDetail | null {
  const agent = seedAgents.find((item) => item.slug === slug && item.isActive);
  if (!agent) return null;
  return {
    ...agentCard(agent),
    email: agent.email,
    phone: agent.phone,
    bio: agent.bio,
    languages: [...agent.languages],
    experienceYears: agent.experienceYears,
    properties: seedProperties
      .filter(
        (property) => property.agentSlug === agent.slug && property.isPublished
      )
      .sort(curatedOrder)
      .map(propertyCard),
  };
}

export function getPublicNeighborhoods() {
  return seedNeighborhoods
    .filter((neighborhood) => neighborhood.isPublished)
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((neighborhood) =>
      neighborhoodCard(
        neighborhood,
        seedProperties.filter(
          (property) =>
            property.isPublished &&
            property.neighborhoodSlug === neighborhood.slug
        ).length
      )
    );
}

export function getPublicNeighborhoodBySlug(
  slug: string
): PublicNeighborhoodDetail | null {
  const neighborhood = seedNeighborhoods.find(
    (item) => item.slug === slug && item.isPublished
  );
  if (!neighborhood) return null;
  const properties = seedProperties
    .filter(
      (property) =>
        property.isPublished && property.neighborhoodSlug === neighborhood.slug
    )
    .sort(curatedOrder);

  return {
    ...neighborhoodCard(neighborhood, properties.length),
    lifestyleHighlights: [...neighborhood.lifestyleHighlights],
    properties: properties.map(propertyCard),
    buyPrices: priceBand(
      properties
        .filter((property) => property.purpose === 'BUY')
        .map((property) => property.priceAmount)
    ),
    rentPrices: priceBand(
      properties
        .filter((property) => property.purpose === 'RENT')
        .map((property) => property.priceAmount)
    ),
  };
}
