import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITestimonial extends Document {
  _id: Types.ObjectId;
  studentName: string;
  examTaken: string;
  score: string;
  year: number;
  quote: string;
  universityAdmitted?: string;
  avatarUrl?: string;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    examTaken: {
      type: String,
      required: [true, 'Exam taken is required'],
      trim: true,
    },
    score: {
      type: String,
      required: [true, 'Score or outcome is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      default: 2025,
    },
    quote: {
      type: String,
      required: [true, 'Testimonial quote is required'],
      trim: true,
    },
    universityAdmitted: {
      type: String,
      default: '',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TestimonialSchema.index({ isApproved: 1, isFeatured: 1, createdAt: -1 });

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);

