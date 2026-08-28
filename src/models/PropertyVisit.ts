import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { VisitStatus, VisitType } from '@/types';
import { SLOT_HOLDING_STATUSES } from '@/types';

const SLOT_DURATION_MS = 60 * 60 * 1000;
const INDIA_TIME_OFFSET_MS = 330 * 60 * 1000;

export interface IPropertyVisit extends Document {
  property: Types.ObjectId;
  agent?: Types.ObjectId;
  user?: Types.ObjectId;

  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;

  startAt: Date;
  endAt: Date;
  timeZone: 'Asia/Kolkata';
  slotActive: boolean;

  visitType: VisitType;
  status: VisitStatus;

  notes?: string;
  cancellationReason?: string;

  idempotencyKey: string;

  createdAt: Date;
  updatedAt: Date;
}

const PropertyVisitSchema = new Schema<IPropertyVisit>(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },

    visitorName: { type: String, required: true, trim: true, maxlength: 100 },
    visitorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    visitorPhone: { type: String, trim: true, maxlength: 20 },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timeZone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
      enum: ['Asia/Kolkata'],
    },
    slotActive: { type: Boolean, required: true, default: true },

    visitType: {
      type: String,
      required: true,
      enum: ['IN_PERSON', 'PRIVATE_VIDEO_TOUR'] satisfies VisitType[],
    },
    status: {
      type: String,
      required: true,
      enum: [
        'PENDING',
        'CONFIRMED',
        'RESCHEDULED',
        'COMPLETED',
        'CANCELLED',
      ] satisfies VisitStatus[],
      default: 'PENDING',
    },

    notes: { type: String, maxlength: 1000 },
    cancellationReason: { type: String, maxlength: 500 },
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      minlength: 16,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

// Partial unique indexes ensure race-safe concurrency:
// 1. Prevents double-booking of the same property slot
PropertyVisitSchema.index(
  { property: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { slotActive: true } }
);

// 2. Prevents an agent from being double-booked across different properties
PropertyVisitSchema.index(
  { agent: 1, startAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slotActive: true,
      agent: { $type: 'objectId' },
    },
  }
);

// 3. Prevents duplicate booking submissions
PropertyVisitSchema.index({ idempotencyKey: 1 }, { unique: true });
PropertyVisitSchema.index({ user: 1 });
PropertyVisitSchema.index({ status: 1, startAt: -1 });

PropertyVisitSchema.pre('validate', function () {
  const shouldHoldSlot = SLOT_HOLDING_STATUSES.includes(
    this.status as (typeof SLOT_HOLDING_STATUSES)[number]
  );
  if (this.slotActive !== shouldHoldSlot) {
    this.invalidate(
      'slotActive',
      `${this.status} visits must set slotActive to ${shouldHoldSlot}.`
    );
  }

  if (this.startAt && this.endAt) {
    if (this.endAt.getTime() - this.startAt.getTime() !== SLOT_DURATION_MS) {
      this.invalidate('endAt', 'endAt must be exactly one hour after startAt.');
    }

    if ((this.startAt.getTime() + INDIA_TIME_OFFSET_MS) % SLOT_DURATION_MS !== 0) {
      this.invalidate(
        'startAt',
        'startAt must be normalized to a canonical Asia/Kolkata hourly slot.'
      );
    }
  }
});

export const PropertyVisit: Model<IPropertyVisit> =
  mongoose.models.PropertyVisit ??
  mongoose.model<IPropertyVisit>('PropertyVisit', PropertyVisitSchema);
