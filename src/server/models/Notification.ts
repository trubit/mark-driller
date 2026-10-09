import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationAudience = 'ALL' | 'PREMIUM' | 'FREE' | 'JAMB' | 'WAEC' | 'NECO' | 'POST_UTME';
export type NotificationType = 'ANNOUNCEMENT' | 'SYSTEM' | 'EXAM_ALERT' | 'ACADEMIC' | 'PAYMENT' | 'SUBSCRIPTION';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'ACTIVE' | 'ARCHIVED';

export interface INotification extends Document {
  _id: Types.ObjectId;
  title: string;
  message: string;
  audience: NotificationAudience;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionText?: string;
  actionLink?: string;
  expiresAt?: Date;
  readBy: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    audience: {
      type: String,
      enum: ['ALL', 'PREMIUM', 'FREE', 'JAMB', 'WAEC', 'NECO', 'POST_UTME'],
      default: 'ALL',
      index: true,
    },
    type: {
      type: String,
      enum: ['ANNOUNCEMENT', 'SYSTEM', 'EXAM_ALERT', 'ACADEMIC', 'PAYMENT', 'SUBSCRIPTION'],
      default: 'ANNOUNCEMENT',
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    actionText: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    actionLink: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    expiresAt: {
      type: Date,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ status: 1, audience: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
