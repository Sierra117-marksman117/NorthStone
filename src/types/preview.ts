import type {
  LeadSource,
  LeadStatus,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  VisitStatus,
  VisitType,
} from '@/types';

export const PREVIEW_STORAGE_KEY = 'northstone_preview_v1';
export const PREVIEW_SCHEMA_VERSION = 1 as const;

export const PREVIEW_TIME_SLOTS = [
  '10:00',
  '11:30',
  '14:00',
  '15:30',
  '17:00',
] as const;

export type PreviewTimeSlot = (typeof PREVIEW_TIME_SLOTS)[number];

export interface PreviewMedia {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export interface PreviewProperty {
  id: string;
  slug: string;
  title: string;
  headline: string;
  purpose: PropertyPurpose;
  propertyType: PropertyType;
  status: PropertyStatus;
  priceAmount: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  neighborhoodId: string;
  neighborhood: string;
  agentId: string;
  amenities: string[];
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  media: PreviewMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface PreviewAgent {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  specializations: string[];
  active: boolean;
  createdAt: string;
}

export interface PreviewLeadHistory {
  id: string;
  status: LeadStatus;
  label: string;
  createdAt: string;
}

export interface PreviewLead {
  id: string;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  customerName: string;
  enquiryType: PropertyPurpose | 'GENERAL';
  source: LeadSource;
  agentId: string;
  status: LeadStatus;
  customerStatus: string;
  message: string;
  internalNotes: string[];
  history: PreviewLeadHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface PreviewVisit {
  id: string;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  customerName: string;
  agentId: string;
  date: string;
  timeSlot: PreviewTimeSlot;
  visitType: VisitType;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewNotification {
  id: string;
  title: string;
  body: string;
  propertySlug?: string;
  read: boolean;
  createdAt: string;
}

export interface PreviewProfile {
  name: string;
  phone: string;
  preferredCity: string;
  preference: PropertyPurpose;
  propertyAlerts: boolean;
  visitReminders: boolean;
}

export interface PreviewNeighborhood {
  id: string;
  slug: string;
  name: string;
  city: string;
  summary: string;
  heroUrl: string;
  lifestyleHighlights: string[];
  published: boolean;
}

export interface PreviewActivity {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
}

export interface PreviewState {
  version: typeof PREVIEW_SCHEMA_VERSION;
  properties: PreviewProperty[];
  agents: PreviewAgent[];
  leads: PreviewLead[];
  visits: PreviewVisit[];
  notifications: PreviewNotification[];
  neighborhoods: PreviewNeighborhood[];
  savedPropertyIds: string[];
  profile: PreviewProfile;
  activity: PreviewActivity[];
}

export interface PreviewMetrics {
  publishedProperties: number;
  availableProperties: number;
  reservedProperties: number;
  newEnquiries: number;
  scheduledVisits: number;
  activeAgents: number;
  savedProperties: number;
  unreadNotifications: number;
  activeEnquiries: number;
  upcomingVisits: number;
  leadStatusDistribution: Array<{ status: LeadStatus; count: number }>;
}
