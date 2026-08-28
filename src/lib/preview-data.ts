import {
  seedAgents,
  seedNeighborhoods,
  seedProperties,
} from '@/scripts/seed-data';
import type { LeadStatus, VisitStatus } from '@/types';
import {
  PREVIEW_SCHEMA_VERSION,
  type PreviewActivity,
  type PreviewLead,
  type PreviewMetrics,
  type PreviewState,
  type PreviewVisit,
} from '@/types/preview';

const SEEDED_AT = '2026-08-28T09:00:00.000Z';

function propertyId(slug: string) {
  return `property-${slug}`;
}

function agentId(slug: string) {
  return `agent-${slug}`;
}

function neighborhoodId(slug: string) {
  return `neighborhood-${slug}`;
}

const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  VISIT_SCHEDULED: 'Visit scheduled',
  NEGOTIATING: 'Negotiating',
  WON: 'Won',
  LOST: 'Lost',
};

const visitStatusLabels: Record<VisitStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function formatPreviewLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function previewLeadStatusLabel(status: LeadStatus) {
  return leadStatusLabels[status];
}

export function previewVisitStatusLabel(status: VisitStatus) {
  return visitStatusLabels[status];
}

export function createPreviewSeed(): PreviewState {
  const properties = seedProperties.map((property, index) => ({
    id: propertyId(property.slug),
    slug: property.slug,
    title: property.title,
    headline: property.headline,
    purpose: property.purpose,
    propertyType: property.propertyType,
    status: property.status,
    priceAmount: property.priceAmount,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqFt:
      property.carpetAreaSqFt ??
      property.builtUpAreaSqFt ??
      property.plotAreaSqFt ??
      0,
    neighborhoodId: neighborhoodId(property.neighborhoodSlug),
    neighborhood: property.address.neighborhood,
    agentId: agentId(property.agentSlug),
    amenities: [...property.amenities],
    featured: property.isFeatured,
    published: property.isPublished,
    seoTitle: property.seo.title,
    seoDescription: property.seo.description,
    media: property.imageAlts.map((alt, mediaIndex) => ({
      id: `${property.slug}-media-${mediaIndex + 1}`,
      url: `/images/generated/properties/${property.slug}-${mediaIndex + 1}.webp`,
      alt,
      order: mediaIndex,
    })),
    createdAt: new Date(Date.parse(SEEDED_AT) - index * 86_400_000).toISOString(),
    updatedAt: SEEDED_AT,
  }));

  const agents = seedAgents.map((agent, index) => ({
    id: agentId(agent.slug),
    slug: agent.slug,
    name: agent.name,
    title: agent.title,
    bio: agent.bio,
    avatarUrl: `/images/generated/agents/${agent.slug}.webp`,
    specializations: [...agent.specializations],
    active: agent.isActive,
    createdAt: new Date(Date.parse(SEEDED_AT) - index * 172_800_000).toISOString(),
  }));

  const neighborhoods = seedNeighborhoods.map((neighborhood) => ({
    id: neighborhoodId(neighborhood.slug),
    slug: neighborhood.slug,
    name: neighborhood.name,
    city: neighborhood.city,
    summary: neighborhood.editorialSummary,
    heroUrl: `/images/generated/neighborhoods/${neighborhood.slug}.webp`,
    lifestyleHighlights: [...neighborhood.lifestyleHighlights],
    published: neighborhood.isPublished,
  }));

  const leads: PreviewLead[] = [
    {
      id: 'lead-anjali-sky-pavilion',
      propertyId: propertyId('sky-pavilion-worli'),
      propertySlug: 'sky-pavilion-worli',
      propertyTitle: 'Sky Pavilion, Worli',
      customerName: 'Anjali Desai',
      enquiryType: 'BUY',
      source: 'PROPERTY_PAGE',
      agentId: agentId('aryan-mehta'),
      status: 'QUALIFIED',
      customerStatus: 'Advisor reviewing your brief',
      message: 'Interested in a private viewing and a concise ownership-cost summary.',
      internalNotes: ['Prefers a sea-facing primary suite and discreet weekday visits.'],
      history: [
        { id: 'history-1', status: 'NEW', label: 'Enquiry received', createdAt: '2026-08-23T08:30:00.000Z' },
        { id: 'history-2', status: 'CONTACTED', label: 'Initial conversation completed', createdAt: '2026-08-24T07:45:00.000Z' },
        { id: 'history-3', status: 'QUALIFIED', label: 'Brief confirmed', createdAt: '2026-08-25T10:15:00.000Z' },
      ],
      createdAt: '2026-08-23T08:30:00.000Z',
      updatedAt: '2026-08-25T10:15:00.000Z',
    },
    {
      id: 'lead-rhea-meridian',
      propertyId: propertyId('the-meridian-lower-parel'),
      propertySlug: 'the-meridian-lower-parel',
      propertyTitle: 'The Meridian, Lower Parel',
      customerName: 'Rhea Malhotra',
      enquiryType: 'BUY',
      source: 'DIRECT',
      agentId: agentId('priya-rajan'),
      status: 'NEW',
      customerStatus: 'Enquiry received',
      message: 'Comparing full-floor residences close to Central Mumbai.',
      internalNotes: [],
      history: [{ id: 'history-4', status: 'NEW', label: 'Enquiry received', createdAt: '2026-08-27T12:20:00.000Z' }],
      createdAt: '2026-08-27T12:20:00.000Z',
      updatedAt: '2026-08-27T12:20:00.000Z',
    },
    {
      id: 'lead-kabir-atelier',
      propertyId: propertyId('worli-atelier-residence'),
      propertySlug: 'worli-atelier-residence',
      propertyTitle: 'Worli Atelier Residence',
      customerName: 'Kabir Shah',
      enquiryType: 'RENT',
      source: 'PROPERTY_PAGE',
      agentId: agentId('vikram-nair'),
      status: 'VISIT_SCHEDULED',
      customerStatus: 'Visit scheduled',
      message: 'Relocating to Mumbai and looking for a furnished residence.',
      internalNotes: ['Twelve-month lease preferred.'],
      history: [
        { id: 'history-5', status: 'NEW', label: 'Enquiry received', createdAt: '2026-08-21T09:00:00.000Z' },
        { id: 'history-6', status: 'VISIT_SCHEDULED', label: 'Private visit arranged', createdAt: '2026-08-26T09:00:00.000Z' },
      ],
      createdAt: '2026-08-21T09:00:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    },
    {
      id: 'lead-meera-villa',
      propertyId: propertyId('courtyard-villa-bandra-west'),
      propertySlug: 'courtyard-villa-bandra-west',
      propertyTitle: 'Courtyard Villa, Bandra West',
      customerName: 'Meera Sethi',
      enquiryType: 'BUY',
      source: 'CONTACT_PAGE',
      agentId: agentId('priya-rajan'),
      status: 'NEGOTIATING',
      customerStatus: 'Advisor preparing next steps',
      message: 'Looking for a low-density family home in Bandra West.',
      internalNotes: ['Requested a comparative market note before the second visit.'],
      history: [
        { id: 'history-7', status: 'NEW', label: 'Enquiry received', createdAt: '2026-08-10T11:00:00.000Z' },
        { id: 'history-8', status: 'NEGOTIATING', label: 'Commercial discussion opened', createdAt: '2026-08-27T13:15:00.000Z' },
      ],
      createdAt: '2026-08-10T11:00:00.000Z',
      updatedAt: '2026-08-27T13:15:00.000Z',
    },
  ];

  const visits: PreviewVisit[] = [
    {
      id: 'visit-sky-pavilion',
      propertyId: propertyId('sky-pavilion-worli'),
      propertySlug: 'sky-pavilion-worli',
      propertyTitle: 'Sky Pavilion, Worli',
      customerName: 'Anjali Desai',
      agentId: agentId('aryan-mehta'),
      date: '2026-09-02',
      timeSlot: '11:30',
      visitType: 'IN_PERSON',
      status: 'CONFIRMED',
      createdAt: '2026-08-25T10:30:00.000Z',
      updatedAt: '2026-08-26T09:15:00.000Z',
    },
    {
      id: 'visit-atelier',
      propertyId: propertyId('worli-atelier-residence'),
      propertySlug: 'worli-atelier-residence',
      propertyTitle: 'Worli Atelier Residence',
      customerName: 'Kabir Shah',
      agentId: agentId('vikram-nair'),
      date: '2026-09-04',
      timeSlot: '15:30',
      visitType: 'PRIVATE_VIDEO_TOUR',
      status: 'PENDING',
      createdAt: '2026-08-26T09:00:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    },
    {
      id: 'visit-meridian-complete',
      propertyId: propertyId('the-meridian-lower-parel'),
      propertySlug: 'the-meridian-lower-parel',
      propertyTitle: 'The Meridian, Lower Parel',
      customerName: 'Anjali Desai',
      agentId: agentId('priya-rajan'),
      date: '2026-08-18',
      timeSlot: '14:00',
      visitType: 'IN_PERSON',
      status: 'COMPLETED',
      createdAt: '2026-08-12T08:00:00.000Z',
      updatedAt: '2026-08-18T11:00:00.000Z',
    },
  ];

  const activity: PreviewActivity[] = [
    { id: 'activity-1', label: 'New enquiry', detail: 'Rhea Malhotra · The Meridian', createdAt: '2026-08-27T12:20:00.000Z' },
    { id: 'activity-2', label: 'Lead progressed', detail: 'Meera Sethi · Negotiating', createdAt: '2026-08-27T13:15:00.000Z' },
    { id: 'activity-3', label: 'Visit confirmed', detail: 'Sky Pavilion · 02 Sep at 11:30', createdAt: '2026-08-26T09:15:00.000Z' },
    { id: 'activity-4', label: 'Property edited', detail: 'The Townhouse · Reserved', createdAt: '2026-08-24T15:45:00.000Z' },
  ];

  return {
    version: PREVIEW_SCHEMA_VERSION,
    properties,
    agents,
    leads,
    visits,
    neighborhoods,
    savedPropertyIds: [
      propertyId('sky-pavilion-worli'),
      propertyId('courtyard-villa-bandra-west'),
      propertyId('worli-atelier-residence'),
    ],
    profile: {
      name: 'Anjali Desai',
      phone: '+91 98765 43210',
      preferredCity: 'Mumbai',
      preference: 'BUY',
      propertyAlerts: true,
      visitReminders: true,
    },
    notifications: [
      {
        id: 'notification-1',
        title: 'Your visit is confirmed',
        body: 'Sky Pavilion is confirmed for 02 September at 11:30.',
        propertySlug: 'sky-pavilion-worli',
        read: false,
        createdAt: '2026-08-26T09:15:00.000Z',
      },
      {
        id: 'notification-2',
        title: 'A new residence matches your brief',
        body: 'The Meridian offers full-floor living in Lower Parel.',
        propertySlug: 'the-meridian-lower-parel',
        read: false,
        createdAt: '2026-08-27T07:30:00.000Z',
      },
      {
        id: 'notification-3',
        title: 'Enquiry update',
        body: 'Your Sky Pavilion brief is now being reviewed by Aryan.',
        propertySlug: 'sky-pavilion-worli',
        read: true,
        createdAt: '2026-08-25T10:15:00.000Z',
      },
    ],
    activity,
  };
}

export function isPreviewState(value: unknown): value is PreviewState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PreviewState>;
  return (
    candidate.version === PREVIEW_SCHEMA_VERSION &&
    Array.isArray(candidate.properties) &&
    Array.isArray(candidate.agents) &&
    Array.isArray(candidate.leads) &&
    Array.isArray(candidate.visits) &&
    Array.isArray(candidate.notifications) &&
    Array.isArray(candidate.neighborhoods) &&
    Array.isArray(candidate.savedPropertyIds) &&
    Array.isArray(candidate.activity) &&
    Boolean(candidate.profile)
  );
}

const activeLeadStatuses = new Set<LeadStatus>([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'NEGOTIATING',
]);

const scheduledVisitStatuses = new Set<VisitStatus>([
  'PENDING',
  'CONFIRMED',
  'RESCHEDULED',
]);

export function getPreviewMetrics(state: PreviewState): PreviewMetrics {
  const leadStatuses: LeadStatus[] = [
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'VISIT_SCHEDULED',
    'NEGOTIATING',
    'WON',
    'LOST',
  ];

  return {
    publishedProperties: state.properties.filter((item) => item.published).length,
    availableProperties: state.properties.filter(
      (item) => item.status === 'AVAILABLE'
    ).length,
    reservedProperties: state.properties.filter(
      (item) => item.status === 'RESERVED'
    ).length,
    newEnquiries: state.leads.filter((item) => item.status === 'NEW').length,
    scheduledVisits: state.visits.filter((item) =>
      scheduledVisitStatuses.has(item.status)
    ).length,
    activeAgents: state.agents.filter((item) => item.active).length,
    savedProperties: state.savedPropertyIds.length,
    unreadNotifications: state.notifications.filter((item) => !item.read).length,
    activeEnquiries: state.leads.filter((item) => activeLeadStatuses.has(item.status)).length,
    upcomingVisits: state.visits.filter((item) => scheduledVisitStatuses.has(item.status)).length,
    leadStatusDistribution: leadStatuses.map((status) => ({
      status,
      count: state.leads.filter((lead) => lead.status === status).length,
    })),
  };
}

export function hasPreviewVisitConflict(
  visits: PreviewVisit[],
  date: string,
  timeSlot: string,
  excludedVisitId?: string
) {
  return visits.some(
    (visit) =>
      visit.id !== excludedVisitId &&
      visit.date === date &&
      visit.timeSlot === timeSlot &&
      ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(visit.status)
  );
}

export function sortPreviewMedia<T extends { order: number }>(media: T[]) {
  return [...media].sort((first, second) => first.order - second.order);
}
