import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAgentAvatar {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  contentHash: string;
}

export interface IAgent extends Document {
  name: string;
  slug: string;
  title: string;
  email: string;
  phone: string;
  whatsapp?: string;
  bio: string;
  avatar?: IAgentAvatar;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  isFeatured: boolean;
  isActive: boolean;
  isIllustrative: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgentAvatarSchema = new Schema<IAgentAvatar>(
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

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    bio: { type: String, required: true, maxlength: 2000 },
    avatar: { type: AgentAvatarSchema },
    specializations: { type: [String], default: [] },
    languages: { type: [String], default: ['English'] },
    experienceYears: { type: Number, required: true, min: 0, max: 60, default: 0 },
    isFeatured: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    isIllustrative: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

AgentSchema.index({ isActive: 1, isFeatured: 1 });

export const Agent: Model<IAgent> =
  mongoose.models.Agent ?? mongoose.model<IAgent>('Agent', AgentSchema);
