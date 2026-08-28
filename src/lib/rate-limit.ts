import { connectToDatabase } from '@/lib/mongodb';
import { RateLimitEntry } from '@/models/RateLimitEntry';
import type { RateLimitScope } from '@/types';
import crypto from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Durable MongoDB-backed atomic rate limiter.
 * Safe across serverless instances and multiple server nodes.
 */
export function createRateLimitKey({
  scope,
  identifier,
  secret,
}: {
  scope: RateLimitScope;
  identifier: string;
  secret: string;
}): string {
  if (secret.length < 16) {
    throw new Error('Rate-limit hashing secret must be at least 16 characters.');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(`${scope}:${identifier.trim().toLowerCase()}`)
    .digest('hex');
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

export async function checkRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
}: {
  scope: RateLimitScope;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('Rate limit must be a positive safe integer.');
  }
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new Error('Rate-limit window must be a positive safe integer.');
  }

  const secret = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('RATE_LIMIT_SALT or NEXTAUTH_SECRET must be configured.');
  }

  await connectToDatabase();

  const nowMs = Date.now();
  const windowId = Math.floor(nowMs / windowMs);
  const expiresAt = new Date((windowId + 1) * windowMs);
  const keyHash = createRateLimitKey({ scope, identifier, secret });
  const filter = { keyHash, windowId };
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { scope, keyHash, windowId, expiresAt },
  };

  let entry;
  try {
    entry = await RateLimitEntry.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    entry = await RateLimitEntry.findOneAndUpdate(
      filter,
      { $inc: { count: 1 } },
      { new: true }
    );
  }

  if (!entry) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs };
  }

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  const retryAfterMs = allowed
    ? 0
    : Math.max(0, entry.expiresAt.getTime() - nowMs);

  return { allowed, remaining, retryAfterMs };
}
