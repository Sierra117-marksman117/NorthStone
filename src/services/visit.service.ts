import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/models/Agent';
import { Notification } from '@/models/Notification';
import { Property } from '@/models/Property';
import { PropertyVisit } from '@/models/PropertyVisit';
import { User } from '@/models/User';
import { SLOT_HOLDING_STATUSES } from '@/types';
import {
  requireActiveActor,
  requireAdminActor,
  ServiceError,
  type ServiceActor,
  type ServiceRequestContext,
  validateRequestContext,
} from '@/services/service-auth';
import { logActivity } from '@/services/audit.service';
import { checkRateLimit } from '@/lib/rate-limit';

const SLOT_DURATION_MS = 60 * 60 * 1000;
const INDIA_TIME_OFFSET_MS = 330 * 60 * 1000;

export function normalizeVisitSlot(date: Date): Date {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new ServiceError('A valid appointment start time is required.', 400);
  }

  const indiaLocalTime = date.getTime() + INDIA_TIME_OFFSET_MS;
  const normalizedLocalTime =
    Math.floor(indiaLocalTime / SLOT_DURATION_MS) * SLOT_DURATION_MS;
  return new Date(normalizedLocalTime - INDIA_TIME_OFFSET_MS);
}

function computeSlotEnd(startAt: Date): Date {
  return new Date(startAt.getTime() + SLOT_DURATION_MS);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

async function createVisitNotification({
  userId,
  propertyId,
  visitId,
  type,
  title,
  message,
  eventKey,
}: {
  userId?: string;
  propertyId: string;
  visitId: string;
  type: 'VISIT_CONFIRMED' | 'VISIT_CANCELLED' | 'VISIT_RESCHEDULED';
  title: string;
  message: string;
  eventKey: string;
}): Promise<void> {
  if (!userId) return;

  const userWantsReminders = await User.exists({
    _id: userId,
    isActive: true,
    'preferences.visitReminders': true,
  });
  if (!userWantsReminders) return;

  const dedupeKey = `${type}:${visitId}:${eventKey}:${userId}`;
  await Notification.updateOne(
    { dedupeKey },
    {
      $setOnInsert: {
        user: userId,
        property: propertyId,
        type,
        title,
        message,
        dedupeKey,
      },
    },
    { upsert: true }
  );
}

export interface CreateVisitInput {
  property: string;
  agent?: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  requestedStart: Date;
  visitType: 'IN_PERSON' | 'PRIVATE_VIDEO_TOUR';
  notes?: string;
  idempotencyKey: string;
}

export async function createVisit(
  input: CreateVisitInput,
  requestContext: ServiceActor | ServiceRequestContext
): Promise<{
  success: boolean;
  visitId?: string;
  conflict?: boolean;
  duplicate?: boolean;
  message: string;
}> {
  validateRequestContext(requestContext);
  await connectToDatabase();
  const rateLimit = await checkRateLimit({
    scope: 'visit',
    identifier: requestContext.ipHash ?? input.visitorEmail,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    throw new ServiceError('Too many visit requests. Please try later.', 429);
  }
  const authenticated =
    'userId' in requestContext
      ? await requireActiveActor(requestContext)
      : undefined;

  const [propertyExists, agentExists] = await Promise.all([
    Property.exists({
      _id: input.property,
      isPublished: true,
      status: { $in: ['AVAILABLE', 'RESERVED', 'UNDER_OFFER'] },
    }),
    input.agent
      ? Agent.exists({ _id: input.agent, isActive: true })
      : Promise.resolve(true),
  ]);
  if (!propertyExists) throw new ServiceError('Property not found.', 404);
  if (!agentExists) throw new ServiceError('Agent not found.', 404);

  const startAt = normalizeVisitSlot(input.requestedStart);
  if (startAt.getTime() <= Date.now()) {
    throw new ServiceError('Appointment time must be in the future.', 400);
  }
  const endAt = computeSlotEnd(startAt);

  try {
    const visit = await PropertyVisit.create({
      property: input.property,
      agent: input.agent,
      user: authenticated?.userId,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail,
      visitorPhone: input.visitorPhone,
      startAt,
      endAt,
      timeZone: 'Asia/Kolkata',
      slotActive: true,
      visitType: input.visitType,
      status: 'PENDING',
      notes: input.notes,
      idempotencyKey: input.idempotencyKey,
    });

    await logActivity({
      actor:
        authenticated ??
        ({ role: 'SYSTEM', ...requestContext } as const),
      action: 'visit.create',
      entityType: 'PropertyVisit',
      entityId: visit._id.toString(),
      changes: [{ field: 'startAt', to: startAt.toISOString() }],
    });

    return {
      success: true,
      visitId: visit._id.toString(),
      message: 'Visit appointment requested.',
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const existing = await PropertyVisit.findOne({
      idempotencyKey: input.idempotencyKey,
      visitorEmail: input.visitorEmail.toLowerCase().trim(),
    })
      .select('_id')
      .lean();
    if (existing) {
      return {
        success: true,
        visitId: existing._id.toString(),
        duplicate: true,
        message: 'Visit request already submitted.',
      };
    }

    return {
      success: false,
      conflict: true,
      message: 'This appointment slot is already reserved.',
    };
  }
}

export async function rescheduleVisit(
  visitId: string,
  newRequestedStart: Date,
  actor: ServiceActor
): Promise<{ success: boolean; conflict?: boolean; message: string }> {
  const authorized = await requireActiveActor(actor);
  const newStart = normalizeVisitSlot(newRequestedStart);
  if (newStart.getTime() <= Date.now()) {
    throw new ServiceError('Appointment time must be in the future.', 400);
  }
  const newEnd = computeSlotEnd(newStart);

  const filter: Record<string, unknown> = {
    _id: visitId,
    status: { $in: SLOT_HOLDING_STATUSES },
    slotActive: true,
  };
  if (authorized.role !== 'ADMIN') filter.user = authorized.userId;

  try {
    const visit = await PropertyVisit.findOneAndUpdate(
      filter,
      {
        $set: {
          startAt: newStart,
          endAt: newEnd,
          status: 'RESCHEDULED',
          slotActive: true,
        },
      },
      { new: true, runValidators: true }
    );
    if (!visit) {
      throw new ServiceError('Visit not found or cannot be rescheduled.', 404);
    }

    await Promise.all([
      createVisitNotification({
        userId: visit.user?.toString(),
        propertyId: visit.property.toString(),
        visitId: visit._id.toString(),
        type: 'VISIT_RESCHEDULED',
        title: 'Property visit rescheduled',
        message: `Your visit is now scheduled for ${newStart.toISOString()}.`,
        eventKey: newStart.toISOString(),
      }),
      logActivity({
        actor: authorized,
        action: 'visit.reschedule',
        entityType: 'PropertyVisit',
        entityId: visit._id.toString(),
        changes: [{ field: 'startAt', to: newStart.toISOString() }],
      }),
    ]);
    return { success: true, message: 'Visit successfully rescheduled.' };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        success: false,
        conflict: true,
        message: 'The requested appointment slot is unavailable.',
      };
    }
    throw error;
  }
}

export async function confirmVisit(
  visitId: string,
  actor: ServiceActor
): Promise<{ success: true; message: string }> {
  const admin = await requireAdminActor(actor);
  const visit = await PropertyVisit.findOneAndUpdate(
    {
      _id: visitId,
      status: { $in: ['PENDING', 'RESCHEDULED'] },
      slotActive: true,
    },
    { $set: { status: 'CONFIRMED', slotActive: true } },
    { new: true, runValidators: true }
  );
  if (!visit) throw new ServiceError('Visit not found or cannot be confirmed.', 404);

  await Promise.all([
    createVisitNotification({
      userId: visit.user?.toString(),
      propertyId: visit.property.toString(),
      visitId: visit._id.toString(),
      type: 'VISIT_CONFIRMED',
      title: 'Property visit confirmed',
      message: `Your visit is confirmed for ${visit.startAt.toISOString()}.`,
      eventKey: visit.startAt.toISOString(),
    }),
    logActivity({
      actor: admin,
      action: 'visit.confirm',
      entityType: 'PropertyVisit',
      entityId: visit._id.toString(),
      changes: [{ field: 'status', to: 'CONFIRMED' }],
    }),
  ]);

  return { success: true, message: 'Visit confirmed.' };
}

export async function cancelVisit(
  visitId: string,
  reason: string,
  actor: ServiceActor
): Promise<{ success: boolean; message: string }> {
  const authorized = await requireActiveActor(actor);
  const filter: Record<string, unknown> = {
    _id: visitId,
    status: { $in: SLOT_HOLDING_STATUSES },
    slotActive: true,
  };
  if (authorized.role !== 'ADMIN') filter.user = authorized.userId;

  const visit = await PropertyVisit.findOneAndUpdate(
    filter,
    {
      $set: {
        status: 'CANCELLED',
        slotActive: false,
        cancellationReason: reason,
      },
    },
    { new: true, runValidators: true }
  );
  if (!visit) throw new ServiceError('Visit not found or cannot be cancelled.', 404);

  await Promise.all([
    createVisitNotification({
      userId: visit.user?.toString(),
      propertyId: visit.property.toString(),
      visitId: visit._id.toString(),
      type: 'VISIT_CANCELLED',
      title: 'Property visit cancelled',
      message: 'Your property visit has been cancelled.',
      eventKey: crypto.randomUUID(),
    }),
    logActivity({
      actor: authorized,
      action: 'visit.cancel',
      entityType: 'PropertyVisit',
      entityId: visit._id.toString(),
      changes: [{ field: 'status', to: 'CANCELLED' }],
    }),
  ]);

  return { success: true, message: 'Visit cancelled.' };
}

export async function completeVisit(
  visitId: string,
  actor: ServiceActor
): Promise<{ success: true; message: string }> {
  const admin = await requireAdminActor(actor);
  const visit = await PropertyVisit.findOneAndUpdate(
    { _id: visitId, status: 'CONFIRMED', slotActive: true },
    { $set: { status: 'COMPLETED', slotActive: false } },
    { new: true, runValidators: true }
  );
  if (!visit) throw new ServiceError('Visit not found or cannot be completed.', 404);

  await logActivity({
    actor: admin,
    action: 'visit.complete',
    entityType: 'PropertyVisit',
    entityId: visit._id.toString(),
    changes: [{ field: 'status', to: 'COMPLETED' }],
  });
  return { success: true, message: 'Visit completed.' };
}
