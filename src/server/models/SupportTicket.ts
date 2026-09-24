import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type SupportCategory =
  | 'PAYMENT_PROBLEM'
  | 'LOGIN_PROBLEM'
  | 'QUESTION_ERROR'
  | 'TECHNICAL_PROBLEM'
  | 'SUBSCRIPTION_PROBLEM'
  | 'OTHER';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  ticketReference: string;
  userId?: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  adminNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    category: {
      type: String,
      enum: [
        'PAYMENT_PROBLEM',
        'LOGIN_PROBLEM',
        'QUESTION_ERROR',
        'TECHNICAL_PROBLEM',
        'SUBSCRIPTION_PROBLEM',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

SupportTicketSchema.index({ createdAt: -1 });

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
