import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExam extends Document {
  _id: Types.ObjectId;
  name: string;
  shortCode: string;
  slug: string;
  description: string;
  region: string;
  syllabusYear: string;
  questionCount: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    region: {
      type: String,
      default: 'West Africa',
    },
    syllabusYear: {
      type: String,
      default: '2025/2026',
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

ExamSchema.index({ isActive: 1, order: 1 });

export const Exam: Model<IExam> = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);

