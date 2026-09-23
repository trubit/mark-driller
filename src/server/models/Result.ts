import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITopicScore {
  topicId?: Types.ObjectId;
  topicName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface ISubjectScore {
  subjectId: Types.ObjectId;
  subjectName: string;
  subjectCode: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface IResult extends Document {
  _id: Types.ObjectId;
  attemptId: Types.ObjectId;
  userId: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  topicBreakdown: ITopicScore[];
  subjectBreakdown?: ISubjectScore[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicScoreSchema = new Schema<ITopicScore>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    topicName: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    accuracyPercentage: { type: Number, required: true },
  },
  { _id: false }
);

const SubjectScoreSchema = new Schema<ISubjectScore>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    accuracyPercentage: { type: Number, required: true },
  },
  { _id: false }
);

const ResultSchema = new Schema<IResult>(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      unique: true,
      index: true,
    },
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
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    incorrectCount: {
      type: Number,
      required: true,
    },
    unansweredCount: {
      type: Number,
      required: true,
    },
    timeSpentSeconds: {
      type: Number,
      required: true,
    },
    topicBreakdown: [TopicScoreSchema],
    subjectBreakdown: [SubjectScoreSchema],
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ userId: 1, createdAt: -1 });

export const Result: Model<IResult> =
  mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);

