import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INeighborhoodHeroMedia {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  contentHash: string;
}

export interface INeighborhoodCoordinates {
  lat: number;
  lng: number;
}

export interface INeighborhoodSeo {
  title?: string;
  description?: string;
}

export interface INeighborhood extends Document {
  name: string;
  slug: string;
  city: string;
  editorialSummary: string;
  heroMedia?: INeighborhoodHeroMedia;
  lifestyleHighlights: string[];
  coordinates?: INeighborhoodCoordinates;
  isPublished: boolean;
  isIllustrative: boolean;
  seo: INeighborhoodSeo;
  createdAt: Date;
  updatedAt: Date;
}

const HeroMediaSchema = new Schema<INeighborhoodHeroMedia>(
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
  },
  { _id: false }
);

const CoordinatesSchema = new Schema<INeighborhoodCoordinates>(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false }
);

const NeighborhoodSeoSchema = new Schema<INeighborhoodSeo>(
  {
    title: { type: String, maxlength: 70 },
    description: { type: String, maxlength: 160 },
  },
  { _id: false }
);

const NeighborhoodSchema = new Schema<INeighborhood>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    editorialSummary: { type: String, required: true, maxlength: 2000 },
    heroMedia: { type: HeroMediaSchema },
    lifestyleHighlights: { type: [String], default: [] },
    coordinates: { type: CoordinatesSchema },
    isPublished: { type: Boolean, required: true, default: false },
    isIllustrative: { type: Boolean, required: true, default: false },
    seo: { type: NeighborhoodSeoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

NeighborhoodSchema.index({ city: 1, isPublished: 1 });

export const Neighborhood: Model<INeighborhood> =
  mongoose.models.Neighborhood ??
  mongoose.model<INeighborhood>('Neighborhood', NeighborhoodSchema);
