/**
 * Property Service — Encapsulates all property business logic, search, and mutations.
 * Route handlers and server actions validate input and call this service.
 * Returns plain serializable objects, never raw Mongoose documents.
 */
import { connectToDatabase } from '@/lib/mongodb';
import { Property } from '@/models/Property';
import { Favorite } from '@/models/Favorite';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { slugify } from '@/lib/utils';
import { isValidPriceAmount } from '@/lib/utils';
import type {
  CompletionStatus,
  FurnishingStatus,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  RentPeriod,
} from '@/types';
import type {
  IPropertyAddress,
  IPropertySeo,
} from '@/models/Property';
import {
  requireAdminActor,
  ServiceError,
  type ServiceActor,
} from '@/services/service-auth';
import { logActivity } from '@/services/audit.service';
import mongoose from 'mongoose';

const PUBLIC_PROPERTY_FIELDS = [
  'title',
  'slug',
  'headline',
  'description',
  'purpose',
  'propertyType',
  'status',
  'isFeatured',
  'priceAmount',
  'currency',
  'rentPeriod',
  'bedrooms',
  'bathrooms',
  'powderRooms',
  'builtUpAreaSqFt',
  'carpetAreaSqFt',
  'plotAreaSqFt',
  'furnishing',
  'completionStatus',
  'yearBuilt',
  'possessionDate',
  'address',
  'amenities',
  'images',
  'floorPlans',
  'assignedAgent',
  'neighborhoodRef',
  'seo',
  'createdAt',
  'updatedAt',
].join(' ');

export interface CreatePropertyInput {
  title: string;
  headline?: string;
  description: string;
  purpose: PropertyPurpose;
  propertyType: PropertyType;
  status?: PropertyStatus;
  isFeatured?: boolean;
  priceAmount: number;
  currency: 'INR';
  rentPeriod?: RentPeriod;
  bedrooms: number;
  bathrooms: number;
  powderRooms?: number;
  builtUpAreaSqFt?: number;
  carpetAreaSqFt?: number;
  plotAreaSqFt?: number;
  furnishing: FurnishingStatus;
  completionStatus: CompletionStatus;
  yearBuilt?: number;
  possessionDate?: Date;
  address: IPropertyAddress;
  amenities?: string[];
  assignedAgent?: string;
  neighborhoodRef?: string;
  seo?: IPropertySeo;
}

export type UpdatePropertyInput = Partial<
  Omit<
    CreatePropertyInput,
    'status' | 'currency' | 'priceAmount' | 'isFeatured'
  >
>;

export interface PropertySearchParams {
  purpose?: PropertyPurpose;
  city?: string;
  neighborhood?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  completionStatus?: string;
  amenities?: string[];
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface PropertySearchResult {
  properties: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}

export async function searchProperties(
  params: PropertySearchParams
): Promise<PropertySearchResult> {
  await connectToDatabase();

  const filter: Record<string, unknown> = { isPublished: true };

  if (params.purpose) filter['purpose'] = params.purpose;
  if (params.city) filter['address.city'] = { $regex: params.city, $options: 'i' };
  if (params.neighborhood) filter['address.neighborhood'] = { $regex: params.neighborhood, $options: 'i' };
  if (params.propertyType) filter['propertyType'] = params.propertyType;
  if (params.furnishing) filter['furnishing'] = params.furnishing;
  if (params.completionStatus) filter['completionStatus'] = params.completionStatus;
  if (params.amenities && params.amenities.length > 0) filter['amenities'] = { $all: params.amenities };

  if (params.bedrooms !== undefined) filter['bedrooms'] = { $gte: params.bedrooms };
  if (params.bathrooms !== undefined) filter['bathrooms'] = { $gte: params.bathrooms };

  const priceFilter: Record<string, number> = {};
  if (params.minPrice) priceFilter['$gte'] = params.minPrice;
  if (params.maxPrice) priceFilter['$lte'] = params.maxPrice;
  if (Object.keys(priceFilter).length > 0) filter['priceAmount'] = priceFilter;

  const sortMap = {
    newest: { createdAt: -1 as const },
    price_asc: { priceAmount: 1 as const },
    price_desc: { priceAmount: -1 as const },
  };
  const sort = sortMap[params.sort ?? 'newest'];

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(24, Math.max(1, params.limit ?? 12));
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .select(PUBLIC_PROPERTY_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(filter),
  ]);

  return {
    properties: properties as Record<string, unknown>[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPropertyBySlug(
  slug: string
): Promise<Record<string, unknown> | null> {
  await connectToDatabase();
  const property = await Property.findOne({ slug, isPublished: true })
    .select(PUBLIC_PROPERTY_FIELDS)
    .populate('assignedAgent', 'name slug title phone email avatar isFeatured')
    .populate('neighborhoodRef', 'name slug city')
    .lean();
  return property as Record<string, unknown> | null;
}

export async function getFeaturedProperties(
  limit = 6
): Promise<Record<string, unknown>[]> {
  await connectToDatabase();
  const properties = await Property.find({ isPublished: true, isFeatured: true })
    .select(PUBLIC_PROPERTY_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return properties as Record<string, unknown>[];
}

/**
 * Notifies all customers who favorited a property when its price or status changes.
 */
async function notifyFavoritingUsersOfChange(
  propertyId: string,
  changeType: 'PROPERTY_STATUS_CHANGE' | 'PROPERTY_PRICE_CHANGE',
  title: string,
  message: string,
  eventKey: string
): Promise<void> {
  await connectToDatabase();
  const favorites = await Favorite.find({ property: propertyId }).select('user').lean();

  if (!favorites.length) return;

  const preferenceField =
    changeType === 'PROPERTY_PRICE_CHANGE'
      ? 'preferences.priceChangeAlerts'
      : 'preferences.inAppPropertyAlerts';
  const userIds = favorites.map((favorite) => favorite.user);
  const users = await User.find({
    _id: { $in: userIds },
    isActive: true,
    [preferenceField]: true,
  })
    .select('_id')
    .lean();

  const notifications = users.map((user) => ({
    user: user._id,
    property: new mongoose.Types.ObjectId(propertyId),
    type: changeType,
    title,
    message,
    dedupeKey: `${changeType}:${propertyId}:${eventKey}:${user._id.toString()}`,
  }));

  if (!notifications.length) return;
  await Notification.bulkWrite(
    notifications.map((notification) => ({
      updateOne: {
        filter: { dedupeKey: notification.dedupeKey },
        update: { $setOnInsert: notification },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

export async function updatePropertyStatus(
  propertyId: string,
  newStatus: PropertyStatus,
  actor: ServiceActor,
  note?: string
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminActor(actor);
  await connectToDatabase();

  const property = await Property.findById(propertyId);
  if (!property) return { success: false, message: 'Property not found.' };

  const oldStatus = property.status;
  if (oldStatus === newStatus) {
    return { success: true, message: `Status is already ${newStatus}.` };
  }
  if (
    (newStatus === 'SOLD' && property.purpose !== 'BUY') ||
    (newStatus === 'RENTED' && property.purpose !== 'RENT')
  ) {
    throw new ServiceError('Final status does not match the property purpose.', 400);
  }

  property.status = newStatus;
  property.statusHistory.push({
    fromStatus: oldStatus,
    toStatus: newStatus,
    changedById: new mongoose.Types.ObjectId(admin.userId),
    note,
    changedAt: new Date(),
  } as unknown as (typeof property.statusHistory)[number]);
  await property.save();

  await notifyFavoritingUsersOfChange(
    propertyId,
    'PROPERTY_STATUS_CHANGE',
    `${property.title} — Status Updated`,
    `This property is now marked as ${newStatus.toLowerCase().replaceAll('_', ' ')}.`,
    `${property.updatedAt.getTime()}:${newStatus}`
  );

  await logActivity({
    actor: admin,
    action: 'property.status_change',
    entityType: 'Property',
    entityId: propertyId,
    changes: [{ field: 'status', from: oldStatus, to: newStatus }],
  });

  return { success: true, message: `Status updated to ${newStatus}.` };
}

export async function updatePropertyPrice(
  propertyId: string,
  priceAmount: number,
  actor: ServiceActor
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminActor(actor);
  if (!isValidPriceAmount(priceAmount)) {
    throw new ServiceError('Price must be a positive safe integer INR amount.', 400);
  }

  const property = await Property.findById(propertyId);
  if (!property) throw new ServiceError('Property not found.', 404);
  const oldPrice = property.priceAmount;
  if (oldPrice === priceAmount) {
    return { success: true, message: 'Price is unchanged.' };
  }

  property.priceAmount = priceAmount;
  await property.save();
  await Promise.all([
    notifyFavoritingUsersOfChange(
      propertyId,
      'PROPERTY_PRICE_CHANGE',
      `${property.title} — Asking Price Updated`,
      'The asking price for a saved property has changed.',
      `${property.updatedAt.getTime()}:${priceAmount}`
    ),
    logActivity({
      actor: admin,
      action: 'property.price_change',
      entityType: 'Property',
      entityId: propertyId,
      changes: [
        { field: 'priceAmount', from: String(oldPrice), to: String(priceAmount) },
      ],
    }),
  ]);

  return { success: true, message: 'Price updated.' };
}

export async function createProperty(
  input: CreatePropertyInput,
  actor: ServiceActor
): Promise<{ propertyId: string; slug: string }> {
  const admin = await requireAdminActor(actor);
  if (!isValidPriceAmount(input.priceAmount)) {
    throw new ServiceError('Price must be a positive safe integer INR amount.', 400);
  }

  const slug = await generateUniquePropertySlug(input.title);
  try {
    const property = await Property.create({
      ...input,
      slug,
      currency: 'INR',
      isPublished: false,
      isFeatured: false,
      isIllustrative: false,
      images: [],
      floorPlans: [],
      internalNotes: [],
      statusHistory: [],
    });
    await logActivity({
      actor: admin,
      action: 'property.create',
      entityType: 'Property',
      entityId: property._id.toString(),
      changes: [{ field: 'slug', to: slug }],
    });
    return { propertyId: property._id.toString(), slug };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ServiceError('A property with this slug already exists.', 409);
    }
    throw error;
  }
}

export async function updateProperty(
  propertyId: string,
  input: UpdatePropertyInput,
  actor: ServiceActor
): Promise<{ success: true }> {
  const admin = await requireAdminActor(actor);
  const property = await Property.findById(propertyId);
  if (!property) throw new ServiceError('Property not found.', 404);

  const fields = [
    'title',
    'headline',
    'description',
    'purpose',
    'propertyType',
    'rentPeriod',
    'bedrooms',
    'bathrooms',
    'powderRooms',
    'builtUpAreaSqFt',
    'carpetAreaSqFt',
    'plotAreaSqFt',
    'furnishing',
    'completionStatus',
    'yearBuilt',
    'possessionDate',
    'address',
    'amenities',
    'assignedAgent',
    'neighborhoodRef',
    'seo',
  ] as const satisfies readonly (keyof UpdatePropertyInput)[];
  const changed: string[] = [];
  for (const field of fields) {
    if (input[field] !== undefined) {
      property.set(field, input[field]);
      changed.push(field);
    }
  }

  if (input.purpose === 'BUY' && input.rentPeriod === undefined) {
    property.rentPeriod = undefined;
  }

  await property.save();
  await logActivity({
    actor: admin,
    action: 'property.update',
    entityType: 'Property',
    entityId: propertyId,
    changes: changed.map((field) => ({ field })),
  });
  return { success: true };
}

export async function setPropertyPublication(
  propertyId: string,
  isPublished: boolean,
  actor: ServiceActor
): Promise<{ success: true }> {
  const admin = await requireAdminActor(actor);
  const property = await Property.findById(propertyId);
  if (!property) throw new ServiceError('Property not found.', 404);

  property.isPublished = isPublished;
  if (!isPublished) property.isFeatured = false;
  await property.save();
  await logActivity({
    actor: admin,
    action: isPublished ? 'property.publish' : 'property.unpublish',
    entityType: 'Property',
    entityId: propertyId,
    changes: [{ field: 'isPublished', to: String(isPublished) }],
  });
  return { success: true };
}

export async function addPropertyInternalNote(
  propertyId: string,
  content: string,
  actor: ServiceActor
): Promise<{ success: true }> {
  const admin = await requireAdminActor(actor);
  const property = await Property.findById(propertyId);
  if (!property) throw new ServiceError('Property not found.', 404);

  property.internalNotes.push({
    authorId: new mongoose.Types.ObjectId(admin.userId),
    content,
    createdAt: new Date(),
  } as unknown as (typeof property.internalNotes)[number]);
  await property.save();
  await logActivity({
    actor: admin,
    action: 'property.update',
    entityType: 'Property',
    entityId: propertyId,
    changes: [{ field: 'internalNotes', to: 'note added' }],
  });
  return { success: true };
}

export async function generateUniquePropertySlug(title: string): Promise<string> {
  await connectToDatabase();
  const base = slugify(title);
  let slug = base;
  let attempt = 0;
  while (await Property.exists({ slug })) {
    attempt++;
    slug = `${base}-${attempt}`;
  }
  return slug;
}
