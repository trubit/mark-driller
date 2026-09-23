import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBookmark extends Document {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    note: {
      type: String,
      maxlength: 250,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

BookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export const Bookmark: Model<IBookmark> =
  mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

