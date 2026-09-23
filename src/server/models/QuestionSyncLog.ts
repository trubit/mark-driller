import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type SyncTrigger = 'SCHEDULED' | 'MANUAL_ADMIN' | 'FILE_IMPORT';
export type SyncStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'RATE_LIMITED';

export interface IQuestionSyncLog extends Document {
  _id: Types.ObjectId;
  sourceProvider: string;
  trigger: SyncTrigger;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: SyncStatus;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSyncLogSchema = new Schema<IQuestionSyncLog>(
  {
    sourceProvider: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    trigger: {
      type: String,
      enum: ['SCHEDULED', 'MANUAL_ADMIN', 'FILE_IMPORT'],
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'RATE_LIMITED'],
      default: 'RUNNING',
      index: true,
    },
    totalFetched: {
      type: Number,
      default: 0,
    },
    totalInserted: {
      type: Number,
      default: 0,
    },
    totalUpdated: {
      type: Number,
      default: 0,
    },
    totalSkipped: {
      type: Number,
      default: 0,
    },
    totalFailed: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

QuestionSyncLogSchema.index({ sourceProvider: 1, startedAt: -1 });

export const QuestionSyncLog: Model<IQuestionSyncLog> =
  mongoose.models.QuestionSyncLog ||
  mongoose.model<IQuestionSyncLog>('QuestionSyncLog', QuestionSyncLogSchema);

