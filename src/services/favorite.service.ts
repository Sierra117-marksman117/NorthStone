import { connectToDatabase } from '@/lib/mongodb';
import { Favorite } from '@/models/Favorite';
import { Property } from '@/models/Property';
import {
  requireActiveActor,
  ServiceError,
  type ServiceActor,
} from '@/services/service-auth';

export async function addFavorite(
  actor: ServiceActor,
  propertyId: string
): Promise<{ success: boolean; message: string }> {
  const authorized = await requireActiveActor(actor);
  await connectToDatabase();
  const propertyExists = await Property.exists({
    _id: propertyId,
    isPublished: true,
  });
  if (!propertyExists) throw new ServiceError('Property not found.', 404);

  try {
    await Favorite.create({ user: authorized.userId, property: propertyId });
    return { success: true, message: 'Property saved.' };
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
      return { success: true, message: 'Property is already in your saved list.' };
    }
    throw err;
  }
}

export async function removeFavorite(
  actor: ServiceActor,
  propertyId: string
): Promise<{ success: boolean; message: string }> {
  const authorized = await requireActiveActor(actor);
  await connectToDatabase();
  await Favorite.deleteOne({ user: authorized.userId, property: propertyId });
  return { success: true, message: 'Property removed from saved list.' };
}

export async function getUserFavorites(
  actor: ServiceActor
): Promise<Record<string, unknown>[]> {
  const authorized = await requireActiveActor(actor);
  await connectToDatabase();
  const favs = await Favorite.find({ user: authorized.userId })
    .populate({
      path: 'property',
      match: { isPublished: true },
      select:
        'title slug priceAmount currency purpose propertyType status images address isFeatured',
    })
    .lean();
  return favs.filter((f) => f.property !== null) as Record<string, unknown>[];
}

export async function isPropertyFavorited(
  actor: ServiceActor,
  propertyId: string
): Promise<boolean> {
  const authorized = await requireActiveActor(actor);
  await connectToDatabase();
  return Boolean(
    await Favorite.exists({ user: authorized.userId, property: propertyId })
  );
}
