import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICourse extends Document {
  _id: Types.ObjectId;
  institutionId: Types.ObjectId;
  name: string;
  faculty: string;
  jambCutoff: number;
  utmeSubjectRequirements: string[];
  directEntryRequirements?: string;
  careerOpportunities: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      index: true,
    },
    faculty: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    jambCutoff: {
      type: Number,
      required: true,
      min: 100,
      max: 400,
    },
    utmeSubjectRequirements: {
      type: [String],
      required: true,
    },
    directEntryRequirements: {
      type: String,
      default: '',
      trim: true,
    },
    careerOpportunities: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.index({ institutionId: 1, name: 1 }, { unique: true });
CourseSchema.index({ faculty: 1, jambCutoff: 1 });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

