import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISubject extends Document {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
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

SubjectSchema.index({ examId: 1, code: 1 }, { unique: true });
SubjectSchema.index({ examId: 1, order: 1 });

export const Subject: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);

