import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFlashcard extends Document {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  topicId?: Types.ObjectId;
  front: string; // Question or concept prompt
  back: string;  // Detailed explanation or formula answer
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      index: true,
    },
    front: {
      type: String,
      required: [true, 'Front prompt is required'],
      trim: true,
    },
    back: {
      type: String,
      required: [true, 'Back answer is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FlashcardSchema.index({ examId: 1, subjectId: 1, isPublished: 1 });

export const Flashcard: Model<IFlashcard> =
  mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);

