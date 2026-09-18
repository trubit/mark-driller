import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CorrectOption = 'A' | 'B' | 'C' | 'D';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionReviewStatus =
  | 'IMPORTED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  topicId?: Types.ObjectId;
  year: number;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOption;
  explanation: string;
  difficulty: QuestionDifficulty;
  imageUrl?: string;
  published: boolean;
  // Provenance & synchronization metadata
  sourceProvider: string;
  sourceQuestionId?: string;
  sourceReference?: string;
  licenseInfo?: string;
  syncVersion: number;
  lastSyncedAt?: Date;
  reviewStatus: QuestionReviewStatus;
  reviewNotes?: string;
  sourceType?: 'development' | 'authorized_real' | 'admin_created' | 'authorized_import';
  isDummy?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
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
    year: {
      type: Number,
      required: true,
      index: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    optionA: {
      type: String,
      required: true,
      trim: true,
    },
    optionB: {
      type: String,
      required: true,
      trim: true,
    },
    optionC: {
      type: String,
      required: true,
      trim: true,
    },
    optionD: {
      type: String,
      required: true,
      trim: true,
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    sourceProvider: {
      type: String,
      default: 'ADMIN_MANUAL',
      index: true,
      trim: true,
    },
    sourceQuestionId: {
      type: String,
      trim: true,
    },
    sourceReference: {
      type: String,
      trim: true,
    },
    licenseInfo: {
      type: String,
      default: 'Authorized Educational Use',
      trim: true,
    },
    syncVersion: {
      type: Number,
      default: 1,
    },
    lastSyncedAt: {
      type: Date,
    },
    reviewStatus: {
      type: String,
      enum: ['IMPORTED', 'REVIEW_REQUIRED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['development', 'authorized_real', 'admin_created', 'authorized_import'],
      default: 'development',
      index: true,
    },
    isDummy: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast querying and uniqueness per exam, subject, year, question number
QuestionSchema.index({ examId: 1, subjectId: 1, year: 1, questionNumber: 1 }, { unique: true });
QuestionSchema.index({ examId: 1, subjectId: 1, topicId: 1 });

// Provenance unique lookup (sparse so questions without external ID don't clash)
QuestionSchema.index(
  { sourceProvider: 1, sourceQuestionId: 1 },
  { unique: true, sparse: true }
);

// High-performance index for question catalog pagination & sorting directly in B-Tree
QuestionSchema.index({ published: 1, reviewStatus: 1, year: -1, questionNumber: 1 });
QuestionSchema.index({ published: 1, reviewStatus: 1, examId: 1, subjectId: 1, year: -1, questionNumber: 1 });
QuestionSchema.index({ published: 1, reviewStatus: 1, examId: 1, subjectId: 1, topicId: 1, year: -1 });

// Full-text search index for fast keyword matching without unbounded regex scans
QuestionSchema.index({ questionText: 'text' });

export const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

