import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFreeTrialUsage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accessedQuestionIds: Types.ObjectId[];
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const FreeTrialUsageSchema = new Schema<IFreeTrialUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    accessedQuestionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    count: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FreeTrialUsage: Model<IFreeTrialUsage> =
  mongoose.models.FreeTrialUsage ||
  mongoose.model<IFreeTrialUsage>('FreeTrialUsage', FreeTrialUsageSchema);
