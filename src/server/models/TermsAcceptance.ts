import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITermsAcceptance extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  termsVersion: string;
  acceptedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  declarationDetails: {
    readAndUnderstood: boolean;
    followInstructions: boolean;
    antiCheating: boolean;
    understandConsequences: boolean;
    accurateInformation: boolean;
    lawfulUse: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TermsAcceptanceSchema = new Schema<ITermsAcceptance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    termsVersion: {
      type: String,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    declarationDetails: {
      readAndUnderstood: { type: Boolean, default: true },
      followInstructions: { type: Boolean, default: true },
      antiCheating: { type: Boolean, default: true },
      understandConsequences: { type: Boolean, default: true },
      accurateInformation: { type: Boolean, default: true },
      lawfulUse: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Idempotent: One acceptance record per student per version
TermsAcceptanceSchema.index({ userId: 1, termsVersion: 1 }, { unique: true });

export const TermsAcceptance: Model<ITermsAcceptance> =
  mongoose.models.TermsAcceptance || mongoose.model<ITermsAcceptance>('TermsAcceptance', TermsAcceptanceSchema);
