import { connectToDatabase } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import type { ActivityAction, ActivityEntityType } from '@/types';
import mongoose from 'mongoose';
import { sanitizeString } from '@/lib/utils';
import type { AuthorizedActor } from '@/services/service-auth';

const SENSITIVE_FIELD_PATTERN =
  /(password|token|cookie|secret|credential|authorization|session)/i;

export interface LogActivityInput {
  actor:
    | AuthorizedActor
    | { role: 'SYSTEM'; correlationId: string; ipHash?: string };
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  changes?: { field: string; from?: string; to?: string }[];
}

function sanitizeChanges(
  changes: LogActivityInput['changes']
): { field: string; from?: string; to?: string }[] {
  return (changes ?? []).slice(0, 30).map((change) => {
    const field = sanitizeString(change.field, 100);
    if (!field || SENSITIVE_FIELD_PATTERN.test(field)) {
      throw new Error('Sensitive or empty audit fields are not permitted.');
    }

    return {
      field,
      ...(change.from === undefined
        ? {}
        : { from: sanitizeString(change.from, 500) }),
      ...(change.to === undefined
        ? {}
        : { to: sanitizeString(change.to, 500) }),
    };
  });
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectToDatabase();
    await ActivityLog.create({
      actor: input.actor.role === 'SYSTEM'
        ? undefined
        : new mongoose.Types.ObjectId(input.actor.userId),
      actorRole: input.actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: sanitizeString(input.entityId, 100),
      changes: sanitizeChanges(input.changes),
      correlationId: sanitizeString(input.actor.correlationId, 100),
      ipHash: input.actor.ipHash,
    });
  } catch (err) {
    // Non-blocking: audit log errors must never abort the primary database action
    console.error('[audit] Failed to record activity log:', err);
  }
}
