import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import type { UserRole } from '@/types';

export interface ServiceRequestContext {
  correlationId: string;
  ipHash?: string;
}

export interface ServiceActor extends ServiceRequestContext {
  userId: string;
}

export interface AuthorizedActor extends ServiceActor {
  role: UserRole;
  name: string;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 400 | 401 | 403 | 404 | 409 | 429
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function validateRequestContext(context: ServiceRequestContext): void {
  if (!context.correlationId || context.correlationId.length > 100) {
    throw new ServiceError('A valid request correlation ID is required.', 400);
  }
}

export async function requireActiveActor(
  actor: ServiceActor
): Promise<AuthorizedActor> {
  validateRequestContext(actor);
  if (!mongoose.isValidObjectId(actor.userId)) {
    throw new ServiceError('Authentication required.', 401);
  }
  await connectToDatabase();

  const user = await User.findOne({ _id: actor.userId, isActive: true })
    .select('name role')
    .lean();
  if (!user) {
    throw new ServiceError('Authentication required.', 401);
  }

  return {
    ...actor,
    role: user.role,
    name: user.name,
  };
}

export async function requireAdminActor(
  actor: ServiceActor
): Promise<AuthorizedActor> {
  const authorized = await requireActiveActor(actor);
  if (authorized.role !== 'ADMIN') {
    throw new ServiceError('Administrator access required.', 403);
  }
  return authorized;
}
