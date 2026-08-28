import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IFavorite extends Document {
  user: Types.ObjectId;
  property: Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

// Compound unique index prevents saving the same property twice
FavoriteSchema.index({ user: 1, property: 1 }, { unique: true });
FavoriteSchema.index({ property: 1 });

export const Favorite: Model<IFavorite> =
  mongoose.models.Favorite ?? mongoose.model<IFavorite>('Favorite', FavoriteSchema);
