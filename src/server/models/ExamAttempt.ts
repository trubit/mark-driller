import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
export type AttemptMode = 'PRACTICE' | 'TIMED_MOCK';

export interface IAttemptAnswer {
  questionId: Types.ObjectId;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
  markedForReview?: boolean;
  answeredAt?: Date;
}

export interface IQuestionSnapshot {
  questionId: Types.ObjectId;
  year: number;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topicId?: Types.ObjectId;
  topicName?: string;
}

export interface IExamAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  mode: AttemptMode;
  status: AttemptStatus;
  allocatedDurationSeconds: number;
  startTime: Date;
  endTime?: Date;
  submittedAt?: Date;
  assignedQuestions: Types.ObjectId[];
  questionSnapshot: IQuestionSnapshot[];
  answers: IAttemptAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}


const AttemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null],
      default: null,
    },
    isCorrect: {
      type: Boolean,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    markedForReview: {
      type: Boolean,
      default: false,
    },
    answeredAt: {
      type: Date,
    },
  },
  { _id: false }
);

const QuestionSnapshotSchema = new Schema<IQuestionSnapshot>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    optionA: {
      type: String,
      required: true,
    },
    optionB: {
      type: String,
      required: true,
    },
    optionC: {
      type: String,
      required: true,
    },
    optionD: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    topicName: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const ExamAttemptSchema = new Schema<IExamAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    mode: {
      type: String,
      enum: ['PRACTICE', 'TIMED_MOCK'],
      default: 'TIMED_MOCK',
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    allocatedDurationSeconds: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    assignedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    questionSnapshot: [QuestionSnapshotSchema],
    answers: [AttemptAnswerSchema],

    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ExamAttemptSchema.index({ userId: 1, createdAt: -1 });
ExamAttemptSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const ExamAttempt: Model<IExamAttempt> =
  mongoose.models.ExamAttempt || mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
