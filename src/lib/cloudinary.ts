import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary environment variables missing. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.'
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    configured = true;
  }
  return cloudinary;
}

// Allowed raster MIME types (no SVG, no PDF)
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

// Magic byte signatures for raster validation
const MAGIC_BYTES: Record<AllowedImageMimeType, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

export function verifyImageMagicBytes(
  buffer: Buffer,
  mimeType: AllowedImageMimeType
): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_PROPERTY = 8;
export const MAX_IMAGE_DIMENSION = 3840; // 4K resolution max

export interface ValidatedImageUpload {
  buffer: Buffer;
  mimeType: AllowedImageMimeType;
  contentHash: string;
}

export function validateImageUpload({
  buffer,
  mimeType,
}: {
  buffer: Buffer;
  mimeType: string;
}): ValidatedImageUpload {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType)) {
    throw new Error('Only JPEG, PNG, and WebP raster images are accepted.');
  }

  if (buffer.length === 0 || buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image size must be between 1 byte and ${MAX_IMAGE_SIZE_BYTES} bytes.`);
  }

  const allowedMimeType = mimeType as AllowedImageMimeType;
  if (!verifyImageMagicBytes(buffer, allowedMimeType)) {
    throw new Error('Image bytes do not match the declared MIME type.');
  }

  return {
    buffer,
    mimeType: allowedMimeType,
    contentHash: computeBufferHash(buffer),
  };
}

export function computeBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
