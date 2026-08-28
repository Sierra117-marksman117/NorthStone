import crypto from 'crypto';

/**
 * Format an INR integer amount to a human-readable string.
 * Examples:
 * - 250000000 -> "₹25 Cr"
 * - 95000000 -> "₹9.5 Cr"
 * - 350000 -> "₹3.5 L"
 * - 85000 -> "₹85,000"
 */
export function formatInrAmount(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 0) return '₹—';

  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    const formatted = cr % 1 === 0 ? cr.toFixed(0) : parseFloat(cr.toFixed(2)).toString();
    return `₹${formatted} Cr`;
  }
  if (amount >= 100_000) {
    const l = amount / 100_000;
    const formatted = l % 1 === 0 ? l.toFixed(0) : parseFloat(l.toFixed(2)).toString();
    return `₹${formatted} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Generate a URL-safe slug from a string.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate a positive safe integer (for price amounts).
 */
export function isValidPriceAmount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

/**
 * Hash an IP address for privacy-safe storage (SHA-256 truncated to 16 chars).
 */
export function hashIp(ip: string, secret: string): string {
  if (secret.length < 16) {
    throw new Error('IP hashing secret must be at least 16 characters.');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(ip.trim())
    .digest('hex')
    .substring(0, 16);
}

/**
 * Sanitize a string for safe storage (strip null bytes, limit length).
 */
export function sanitizeString(input: string, maxLength = 2000): string {
  return input.replace(/\0/g, '').trim().substring(0, maxLength);
}
