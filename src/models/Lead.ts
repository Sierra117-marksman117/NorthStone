import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { LeadStatus, LeadSource, InquiryType } from '@/types';

export interface ILeadNote {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface ILeadStatusHistory {
  _id: Types.ObjectId;
  fromStatus?: LeadStatus;
  toStatus: LeadStatus;
  changedById: Types.ObjectId;
  changedByName: string;
  note?: string;
  changedAt: Date;
}

export interface ILead extends Document {
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message?: string;
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'WHATSAPP';

  inquiryType: InquiryType;
  source: LeadSource;

  property?: Types.ObjectId;
  agent?: Types.ObjectId;
  user?: Types.ObjectId;

  status: LeadStatus;
  assignedTo?: Types.ObjectId;

  internalNotes: ILeadNote[];
  statusHistory: ILeadStatusHistory[];

  idempotencyKey: string;

  createdAt: Date;
  updatedAt: Date;
}

const LeadNoteSchema = new Schema<ILeadNote>(
  {
    authorId: { type: Schema.Types.ObjectId, required: true },
    authorName: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { _id: true }
);

const StatusHistorySchema = new Schema<ILeadStatusHistory>(
  {
    fromStatus: {
      type: String,
      enum: [
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'VISIT_SCHEDULED',
        'NEGOTIATING',
        'WON',
        'LOST',
      ] satisfies LeadStatus[],
    },
    toStatus: {
      type: String,
      required: true,
      enum: [
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'VISIT_SCHEDULED',
        'NEGOTIATING',
        'WON',
        'LOST',
      ] satisfies LeadStatus[],
    },
    changedById: { type: Schema.Types.ObjectId, required: true },
    changedByName: { type: String, required: true, maxlength: 100 },
    note: { type: String, maxlength: 500 },
    changedAt: { type: Date, default: Date.now, immutable: true },
  },
  { _id: true }
);

const LeadSchema = new Schema<ILead>(
  {
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
    message: { type: String, maxlength: 2000 },
    preferredContactMethod: {
      type: String,
      required: true,
      enum: ['EMAIL', 'PHONE', 'WHATSAPP'],
      default: 'EMAIL',
    },
    inquiryType: {
      type: String,
      required: true,
      enum: ['BUY', 'RENT', 'VALUATION', 'GENERAL'] satisfies InquiryType[],
    },
    source: {
      type: String,
      required: true,
      enum: [
        'PROPERTY_PAGE',
        'AGENT_PAGE',
        'CONTACT_PAGE',
        'DIRECT',
      ] satisfies LeadSource[],
    },
    property: { type: Schema.Types.ObjectId, ref: 'Property' },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      required: true,
      enum: [
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'VISIT_SCHEDULED',
        'NEGOTIATING',
        'WON',
        'LOST',
      ] satisfies LeadStatus[],
      default: 'NEW',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    internalNotes: { type: [LeadNoteSchema], default: [] },
    statusHistory: { type: [StatusHistorySchema], default: [] },
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

LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ property: 1 });
LeadSchema.index({ agent: 1 });
LeadSchema.index({ user: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ idempotencyKey: 1 }, { unique: true });

LeadSchema.pre('validate', function () {
  if (
    (this.preferredContactMethod === 'PHONE' ||
      this.preferredContactMethod === 'WHATSAPP') &&
    !this.visitorPhone
  ) {
    this.invalidate(
      'visitorPhone',
      'visitorPhone is required for phone or WhatsApp contact.'
    );
  }
});

export const Lead: Model<ILead> =
  mongoose.models.Lead ?? mongoose.model<ILead>('Lead', LeadSchema);
