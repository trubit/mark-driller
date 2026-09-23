import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PlanType } from './Subscription.js';

export interface IActivationKey extends Document {
  _id: Types.ObjectId;
  code: string;
  plan: PlanType;
  durationDays: number;
  isRedeemed: boolean;
  redeemedBy?: Types.ObjectId;
  redeemedAt?: Date;
  batchId?: string;
  resellerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivationKeySchema = new Schema<IActivationKey>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['PRO_MONTHLY', 'PRO_ANNUAL'],
      default: 'PRO_MONTHLY',
      required: true,
    },
    durationDays: {
      type: Number,
      default: 30,
      required: true,
    },
    isRedeemed: {
      type: Boolean,
      default: false,
      index: true,
    },
    redeemedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    batchId: {
      type: String,
      index: true,
    },
    resellerName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const ActivationKey: Model<IActivationKey> =
  mongoose.models.ActivationKey || mongoose.model<IActivationKey>('ActivationKey', ActivationKeySchema);

