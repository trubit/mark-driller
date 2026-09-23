import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IVideoLesson extends Document {
  _id: Types.ObjectId;
  title: string;
  videoId: string; // YouTube video identifier
  duration: string;
  examId?: Types.ObjectId;
  subjectId?: Types.ObjectId;
  topicName?: string;
  isPremium: boolean;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoLessonSchema = new Schema<IVideoLesson>(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      index: true,
    },
    videoId: {
      type: String,
      required: [true, 'YouTube video ID is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      default: '15:00',
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      index: true,
    },
    topicName: {
      type: String,
      default: 'General Revision',
      trim: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
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

VideoLessonSchema.index({ isPublished: 1, order: 1 });

export const VideoLesson: Model<IVideoLesson> =
  mongoose.models.VideoLesson || mongoose.model<IVideoLesson>('VideoLesson', VideoLessonSchema);

