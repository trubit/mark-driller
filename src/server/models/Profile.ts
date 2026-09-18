import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProfile extends Document {
  userId: Types.ObjectId;
  phone?: string;
  avatar?: string;
  educationLevel?: string;
  state?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    avatar: {
      type: String,
      trim: true,
    },
    educationLevel: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    country: {
      type: String,
      default: 'Nigeria',
      trim: true,
      maxlength: 50,
    },
  },
  {
    timestamps: true,
  }
);

export const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
