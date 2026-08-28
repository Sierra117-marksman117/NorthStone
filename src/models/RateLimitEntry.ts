import mongoose, { Document, Model, Schema } from 'mongoose';
import { RATE_LIMIT_SCOPES, type RateLimitScope } from '@/types';

export interface IRateLimitEntry extends Document {
  scope: RateLimitScope;
  keyHash: string;
  windowId: number;
  count: number;
  expiresAt: Date;
}

const RateLimitEntrySchema = new Schema<IRateLimitEntry>(
  {
    scope: { type: String, required: true, enum: RATE_LIMIT_SCOPES },
    keyHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    windowId: { type: Number, required: true, min: 0 },
    count: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false, versionKey: false }
);

RateLimitEntrySchema.index(
  { keyHash: 1, windowId: 1 },
  { unique: true, name: 'rate_limit_window_unique' }
);
RateLimitEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitEntry: Model<IRateLimitEntry> =
  mongoose.models.RateLimitEntry ??
  mongoose.model<IRateLimitEntry>('RateLimitEntry', RateLimitEntrySchema);
