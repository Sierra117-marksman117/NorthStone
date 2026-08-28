import mongoose, { Document, Model, Schema } from 'mongoose';
import type { UserRole } from '@/types';

export interface IUserPreferences {
  emailComms: boolean;
  inAppPropertyAlerts: boolean;
  priceChangeAlerts: boolean;
  visitReminders: boolean;
}

export interface IUserAvatar {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  contentHash: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: IUserAvatar;
  isActive: boolean;
  failedLoginAttempts: number;
  lockoutExpires?: Date;
  tokenVersion: number;
  lastLoginAt?: Date;
  sessionsValidAfter?: Date;
  preferences: IUserPreferences;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    emailComms: { type: Boolean, default: true },
    inAppPropertyAlerts: { type: Boolean, default: true },
    priceChangeAlerts: { type: Boolean, default: true },
    visitReminders: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserAvatarSchema = new Schema<IUserAvatar>(
  {
    publicId: { type: String, required: true },
    secureUrl: {
      type: String,
      required: true,
      maxlength: 1000,
      match: /^https:\/\//,
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

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'CUSTOMER'] satisfies UserRole[],
      default: 'CUSTOMER',
    },
    phone: { type: String, trim: true, maxlength: 20 },
    avatar: { type: UserAvatarSchema },
    isActive: { type: Boolean, required: true, default: true },
    failedLoginAttempts: { type: Number, required: true, default: 0 },
    lockoutExpires: { type: Date },
    tokenVersion: { type: Number, required: true, default: 0 },
    lastLoginAt: { type: Date },
    sessionsValidAfter: { type: Date },
    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
