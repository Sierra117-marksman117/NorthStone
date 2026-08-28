import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_TYPES,
  type ActivityAction,
  type ActivityEntityType,
} from '@/types';

export interface IFieldChange {
  field: string;
  from?: string;
  to?: string;
}

export interface IActivityLog extends Document {
  actor?: Types.ObjectId;
  actorRole: 'ADMIN' | 'CUSTOMER' | 'SYSTEM';
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  changes: IFieldChange[];
  correlationId: string;
  ipHash?: string;
  createdAt: Date;
}

const FieldChangeSchema = new Schema<IFieldChange>(
  {
    field: { type: String, required: true, maxlength: 100 },
    from: { type: String, maxlength: 500 },
    to: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: {
      type: String,
      required: true,
      enum: ['ADMIN', 'CUSTOMER', 'SYSTEM'],
    },
    action: {
      type: String,
      required: true,
      enum: ACTIVITY_ACTIONS,
    },
    entityType: {
      type: String,
      required: true,
      enum: ACTIVITY_ENTITY_TYPES,
    },
    entityId: { type: String, required: true, maxlength: 100 },
    changes: { type: [FieldChangeSchema], default: [] },
    correlationId: { type: String, required: true, maxlength: 100 },
    ipHash: { type: String, maxlength: 16 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

ActivityLogSchema.index({ actor: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });
// TTL index: 180-day retention policy
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });

ActivityLogSchema.pre('validate', function () {
  if (this.actorRole !== 'SYSTEM' && !this.actor) {
    this.invalidate('actor', 'actor is required for non-system activity.');
  }
});

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
