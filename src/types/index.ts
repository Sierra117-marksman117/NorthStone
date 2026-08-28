/**
 * Shared TypeScript types across the application.
 * Isomorphic types and constants — safe to import in client and server code.
 */

export type UserRole = 'ADMIN' | 'CUSTOMER';

export type PropertyPurpose = 'BUY' | 'RENT';

export type PropertyType =
  | 'PENTHOUSE'
  | 'VILLA'
  | 'MANSION'
  | 'ESTATE'
  | 'APARTMENT'
  | 'TOWNHOUSE'
  | 'STUDIO'
  | 'COMMERCIAL';

export type PropertyStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'UNDER_OFFER'
  | 'SOLD'
  | 'RENTED';

export type CompletionStatus = 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION';

export type FurnishingStatus = 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';

export type RentPeriod = 'MONTH' | 'YEAR';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'VISIT_SCHEDULED'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST';

export type LeadSource =
  | 'PROPERTY_PAGE'
  | 'AGENT_PAGE'
  | 'CONTACT_PAGE'
  | 'DIRECT';

export type InquiryType = 'BUY' | 'RENT' | 'VALUATION' | 'GENERAL';

export type VisitStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED';

export type VisitType = 'IN_PERSON' | 'PRIVATE_VIDEO_TOUR';

export type NotificationType =
  | 'PROPERTY_STATUS_CHANGE'
  | 'PROPERTY_PRICE_CHANGE'
  | 'VISIT_CONFIRMED'
  | 'VISIT_CANCELLED'
  | 'VISIT_RESCHEDULED'
  | 'LEAD_UPDATE';

export const ACTIVITY_ACTIONS = [
  'user.register',
  'user.login',
  'user.logout',
  'user.password_change',
  'user.profile_update',
  'property.create',
  'property.update',
  'property.publish',
  'property.unpublish',
  'property.status_change',
  'property.price_change',
  'property.delete',
  'agent.create',
  'agent.update',
  'agent.delete',
  'lead.create',
  'lead.status_change',
  'lead.note_add',
  'visit.create',
  'visit.confirm',
  'visit.reschedule',
  'visit.cancel',
  'visit.complete',
  'upload.success',
  'upload.rejected',
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ENTITY_TYPES = [
  'User',
  'Property',
  'Agent',
  'Lead',
  'PropertyVisit',
  'Favorite',
  'Notification',
  'MediaAsset',
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const RATE_LIMIT_SCOPES = [
  'registration',
  'login-email',
  'login-ip',
  'contact',
  'lead',
  'visit',
  'password-recovery',
  'upload',
] as const;

export type RateLimitScope = (typeof RATE_LIMIT_SCOPES)[number];

// Allowlisted lead status transitions
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['VISIT_SCHEDULED', 'NEGOTIATING', 'LOST'],
  VISIT_SCHEDULED: ['NEGOTIATING', 'QUALIFIED', 'LOST'],
  NEGOTIATING: ['WON', 'LOST'],
  WON: [],
  LOST: ['NEW'], // Allow reopening
};

// Visit statuses that hold a booking slot
export const SLOT_HOLDING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'RESCHEDULED',
] as const satisfies readonly VisitStatus[];
