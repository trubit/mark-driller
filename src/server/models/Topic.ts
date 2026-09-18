import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITopic extends Document {
  _id: Types.ObjectId;
  subjectId: Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

TopicSchema.index({ subjectId: 1, name: 1 }, { unique: true });
TopicSchema.index({ subjectId: 1, order: 1 });

export const Topic: Model<ITopic> = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
