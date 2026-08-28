import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { NotificationType } from '@/types';

export interface INotification extends Document {
  user: Types.ObjectId;
  property?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey: string;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property' },
    type: {
      type: String,
      required: true,
      enum: [
        'PROPERTY_STATUS_CHANGE',
        'PROPERTY_PRICE_CHANGE',
        'VISIT_CONFIRMED',
        'VISIT_CANCELLED',
        'VISIT_RESCHEDULED',
        'LEAD_UPDATE',
      ] satisfies NotificationType[],
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    dedupeKey: { type: String, required: true, maxlength: 300 },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ dedupeKey: 1 }, { unique: true });
// TTL index: automatically clean up notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>('Notification', NotificationSchema);
