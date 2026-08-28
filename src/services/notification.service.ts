import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import {
  requireActiveActor,
  type ServiceActor,
} from '@/services/service-auth';

export async function getUserNotifications(
  actor: ServiceActor,
  limit = 20
): Promise<Record<string, unknown>[]> {
  const authorized = await requireActiveActor(actor);
  await connectToDatabase();
  const safeLimit = Math.min(50, Math.max(1, limit));
  const notifications = await Notification.find({ user: authorized.userId })
    .select('property type title message readAt createdAt')
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
  return notifications as Record<string, unknown>[];
}

export async function markNotificationRead(
  actor: ServiceActor,
  notificationId: string,
): Promise<{ success: boolean }> {
  const authorized = await requireActiveActor(actor);
  await connectToDatabase();
  const result = await Notification.updateOne(
    { _id: notificationId, user: authorized.userId },
    { $set: { readAt: new Date() } }
  );
  return { success: result.matchedCount > 0 };
}
