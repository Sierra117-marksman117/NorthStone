import type {
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  RentPeriod,
} from '@/types';

export interface PublicMedia {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface PublicAgentCard {
  id: string;
  name: string;
  slug: string;
  title: string;
  avatar: PublicMedia | null;
  specializations: string[];
}

export interface PublicNeighborhoodCard {
  id: string;
  name: string;
  slug: string;
  city: string;
  summary: string;
  hero: PublicMedia | null;
  propertyCount: number;
}

export interface PublicPropertyCard {
  id: string;
  title: string;
  slug: string;
  purpose: PropertyPurpose;
  propertyType: PropertyType;
  status: PropertyStatus;
  priceAmount: number;
  rentPeriod?: RentPeriod;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number | null;
  neighborhood: string;
  city: string;
  image: PublicMedia | null;
}

export interface PublicPropertyDetail extends PublicPropertyCard {
  headline: string;
  description: string;
  powderRooms: number;
  builtUpAreaSqFt: number | null;
  carpetAreaSqFt: number | null;
  plotAreaSqFt: number | null;
  furnishing: string;
  completionStatus: string;
  amenities: string[];
  images: PublicMedia[];
  agent: (PublicAgentCard & {
    email: string;
    phone: string;
    bio: string;
  }) | null;
  neighborhoodDetails: (PublicNeighborhoodCard & {
    lifestyleHighlights: string[];
  }) | null;
  similar: PublicPropertyCard[];
}

export interface PublicAgentDetail extends PublicAgentCard {
  email: string;
  phone: string;
  bio: string;
  languages: string[];
  experienceYears: number;
  properties: PublicPropertyCard[];
}

export interface AskingPriceBand {
  minimum: number;
  maximum: number;
  median: number;
}

export interface PublicNeighborhoodDetail extends PublicNeighborhoodCard {
  lifestyleHighlights: string[];
  properties: PublicPropertyCard[];
  buyPrices: AskingPriceBand | null;
  rentPrices: AskingPriceBand | null;
}

export type PropertySort = 'newest' | 'price-asc' | 'price-desc';

export interface PublicPropertySearch {
  purpose?: PropertyPurpose;
  neighborhood?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sort: PropertySort;
  page: number;
  limit: number;
}

export interface PublicPropertySearchResult {
  properties: PublicPropertyCard[];
  total: number;
  page: number;
  totalPages: number;
}
