import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  PropertyPurpose,
  PropertyType,
  PropertyStatus,
  CompletionStatus,
  FurnishingStatus,
  RentPeriod,
} from '@/types';

export interface IPropertyAddress {
  line1: string;
  line2?: string;
  neighborhood: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IPropertyImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  contentHash: string;
  alt: string;
  order: number;
  isFeatured: boolean;
}

export interface IPropertyFloorPlan {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  contentHash: string;
  label: string;
}

export interface IPropertySeo {
  title?: string;
  description?: string;
  canonicalPath?: string;
}

export interface IPropertyInternalNote {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IPropertyStatusHistory {
  _id: Types.ObjectId;
  fromStatus?: PropertyStatus;
  toStatus: PropertyStatus;
  changedById: Types.ObjectId;
  note?: string;
  changedAt: Date;
}

export interface IProperty extends Document {
  title: string;
  slug: string;
  headline?: string;
  description: string;
  purpose: PropertyPurpose;
  propertyType: PropertyType;
  status: PropertyStatus;
  isPublished: boolean;
  isFeatured: boolean;
  isIllustrative: boolean;

  // Money model: integer INR amounts only; formatted at render time
  priceAmount: number;
  currency: 'INR';
  rentPeriod?: RentPeriod;

  bedrooms: number;
  bathrooms: number;
  powderRooms: number;
  builtUpAreaSqFt?: number;
  carpetAreaSqFt?: number;
  plotAreaSqFt?: number;
  furnishing: FurnishingStatus;
  completionStatus: CompletionStatus;
  yearBuilt?: number;
  possessionDate?: Date;

  address: IPropertyAddress;
  amenities: string[];
  images: IPropertyImage[];
  floorPlans: IPropertyFloorPlan[];

  assignedAgent?: Types.ObjectId;
  neighborhoodRef?: Types.ObjectId;

  viewsCount: number;
  seo: IPropertySeo;
  internalNotes: IPropertyInternalNote[];
  statusHistory: IPropertyStatusHistory[];

  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IPropertyAddress>(
  {
    line1: { type: String, required: true, maxlength: 200 },
    line2: { type: String, maxlength: 200 },
    neighborhood: { type: String, required: true, maxlength: 100 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    pincode: { type: String, required: true, maxlength: 10 },
  },
  { _id: false }
);

const ImageSchema = new Schema<IPropertyImage>(
  {
    publicId: { type: String, required: true },
    secureUrl: {
      type: String,
      required: true,
      maxlength: 1000,
      match: /^(?:https:\/\/|\/images\/)/,
    },
    width: { type: Number, required: true, min: 1, max: 3840 },
    height: { type: Number, required: true, min: 1, max: 3840 },
    format: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['jpg', 'jpeg', 'png', 'webp'],
    },
    contentHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    alt: { type: String, required: true, maxlength: 200 },
    order: { type: Number, required: true, default: 0 },
    isFeatured: { type: Boolean, required: true, default: false },
  },
  { _id: true }
);

const FloorPlanSchema = new Schema<IPropertyFloorPlan>(
  {
    publicId: { type: String, required: true },
    secureUrl: {
      type: String,
      required: true,
      maxlength: 1000,
      match: /^(?:https:\/\/|\/images\/)/,
    },
    width: { type: Number, required: true, min: 1, max: 3840 },
    height: { type: Number, required: true, min: 1, max: 3840 },
    format: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['jpg', 'jpeg', 'png', 'webp'],
    },
    contentHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },
    label: { type: String, required: true, maxlength: 100 },
  },
  { _id: true }
);

const PropertySeoSchema = new Schema<IPropertySeo>(
  {
    title: { type: String, maxlength: 70 },
    description: { type: String, maxlength: 160 },
    canonicalPath: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const PropertyInternalNoteSchema = new Schema<IPropertyInternalNote>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, required: true, default: Date.now, immutable: true },
  },
  { _id: true }
);

const PROPERTY_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'UNDER_OFFER',
  'SOLD',
  'RENTED',
] as const satisfies readonly PropertyStatus[];

const PropertyStatusHistorySchema = new Schema<IPropertyStatusHistory>(
  {
    fromStatus: { type: String, enum: PROPERTY_STATUSES },
    toStatus: { type: String, required: true, enum: PROPERTY_STATUSES },
    changedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: { type: String, maxlength: 500 },
    changedAt: { type: Date, required: true, default: Date.now, immutable: true },
  },
  { _id: true }
);

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    headline: { type: String, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 10_000 },
    purpose: {
      type: String,
      required: true,
      enum: ['BUY', 'RENT'] satisfies PropertyPurpose[],
    },
    propertyType: {
      type: String,
      required: true,
      enum: [
        'PENTHOUSE',
        'VILLA',
        'MANSION',
        'ESTATE',
        'APARTMENT',
        'TOWNHOUSE',
        'STUDIO',
        'COMMERCIAL',
      ] satisfies PropertyType[],
    },
    status: {
      type: String,
      required: true,
      enum: PROPERTY_STATUSES,
      default: 'AVAILABLE',
    },
    isPublished: { type: Boolean, required: true, default: false },
    isFeatured: { type: Boolean, required: true, default: false },
    isIllustrative: { type: Boolean, required: true, default: false },

    priceAmount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) =>
          Number.isFinite(v) && Number.isSafeInteger(v) && v > 0,
        message:
          'priceAmount must be a positive safe integer INR amount.',
      },
    },
    currency: { type: String, required: true, default: 'INR', enum: ['INR'] },
    rentPeriod: {
      type: String,
      enum: ['MONTH', 'YEAR'] satisfies RentPeriod[],
      required: function (this: IProperty) {
        return this.purpose === 'RENT';
      },
      validate: {
        validator: function (this: IProperty, value?: RentPeriod) {
          return this.purpose === 'RENT' ? Boolean(value) : value === undefined;
        },
        message: 'rentPeriod is required only for rental properties.',
      },
    },

    bedrooms: { type: Number, required: true, min: 0, max: 50 },
    bathrooms: { type: Number, required: true, min: 0, max: 50 },
    powderRooms: { type: Number, required: true, default: 0, min: 0, max: 20 },
    builtUpAreaSqFt: { type: Number, min: 0 },
    carpetAreaSqFt: { type: Number, min: 0 },
    plotAreaSqFt: { type: Number, min: 0 },
    furnishing: {
      type: String,
      required: true,
      enum: [
        'FURNISHED',
        'SEMI_FURNISHED',
        'UNFURNISHED',
      ] satisfies FurnishingStatus[],
    },
    completionStatus: {
      type: String,
      required: true,
      enum: [
        'READY_TO_MOVE',
        'UNDER_CONSTRUCTION',
      ] satisfies CompletionStatus[],
    },
    yearBuilt: { type: Number, min: 1900, max: 2100 },
    possessionDate: { type: Date },

    address: { type: AddressSchema, required: true },
    amenities: { type: [String], default: [] },
    images: {
      type: [ImageSchema],
      default: [],
      validate: [
        {
          validator: (images: IPropertyImage[]) => images.length <= 8,
          message: 'A property may contain at most 8 images.',
        },
        {
          validator: (images: IPropertyImage[]) =>
            new Set(images.map((image) => image.contentHash)).size === images.length,
          message: 'Property images must have unique content hashes.',
        },
      ],
    },
    floorPlans: {
      type: [FloorPlanSchema],
      default: [],
      validate: {
        validator: (plans: IPropertyFloorPlan[]) =>
          new Set(plans.map((plan) => plan.contentHash)).size === plans.length,
        message: 'Floor plans must have unique content hashes.',
      },
    },

    assignedAgent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    neighborhoodRef: { type: Schema.Types.ObjectId, ref: 'Neighborhood' },

    viewsCount: { type: Number, required: true, default: 0 },
    seo: { type: PropertySeoSchema, default: () => ({}) },
    internalNotes: { type: [PropertyInternalNoteSchema], default: [] },
    statusHistory: { type: [PropertyStatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

// Search & Filter Index Definitions
PropertySchema.index({ isPublished: 1, status: 1, purpose: 1 });
PropertySchema.index({ isPublished: 1, isFeatured: 1 });
PropertySchema.index({ isPublished: 1, propertyType: 1 });
PropertySchema.index({ isPublished: 1, priceAmount: 1 });
PropertySchema.index({ isPublished: 1, 'address.city': 1 });
PropertySchema.index({ isPublished: 1, 'address.neighborhood': 1 });
PropertySchema.index({ assignedAgent: 1 });
PropertySchema.index({ neighborhoodRef: 1 });
PropertySchema.index({ 'images.contentHash': 1 });
PropertySchema.index({ createdAt: -1 });
PropertySchema.index(
  {
    title: 'text',
    description: 'text',
    'address.neighborhood': 'text',
    'address.city': 'text',
  },
  { name: 'property_text_search' }
);

PropertySchema.pre('validate', function () {
  if (this.isPublished && this.images.length < 3) {
    this.invalidate(
      'images',
      'Published properties require at least 3 approved images.'
    );
  }

  const featuredCount = this.images.filter((image) => image.isFeatured).length;
  if (featuredCount > 1) {
    this.invalidate('images', 'Only one property image may be featured.');
  }
});

export const Property: Model<IProperty> =
  mongoose.models.Property ?? mongoose.model<IProperty>('Property', PropertySchema);
