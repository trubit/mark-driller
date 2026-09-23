import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PENDING_REVIEW' | 'SUCCESS' | 'FAILED' | 'REJECTED';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  reference: string;
  amountKobo: number; // Stored in smallest currency unit (kobo)
  currency: string;
  provider: 'PAYSTACK' | 'FLUTTERWAVE' | 'MANUAL_BANK_TRANSFER' | 'SCRATCH_CARD_PIN';
  status: PaymentStatus;
  channel?: string;
  paidAt?: Date;
  proofUrl?: string;
  depositorName?: string;
  bankName?: string;
  transferDate?: Date;
  adminReviewNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amountKobo: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    provider: {
      type: String,
      enum: ['PAYSTACK', 'FLUTTERWAVE', 'MANUAL_BANK_TRANSFER', 'SCRATCH_CARD_PIN'],
      default: 'PAYSTACK',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PENDING_REVIEW', 'SUCCESS', 'FAILED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    channel: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    proofUrl: {
      type: String,
      trim: true,
    },
    depositorName: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    transferDate: {
      type: Date,
    },
    adminReviewNotes: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

