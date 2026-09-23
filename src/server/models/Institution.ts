import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type InstitutionType =
  | 'FEDERAL_UNI'
  | 'STATE_UNI'
  | 'PRIVATE_UNI'
  | 'POLYTECHNIC'
  | 'COLLEGE_OF_ED';

export interface IInstitution extends Document {
  _id: Types.ObjectId;
  name: string;
  shortCode: string;
  type: InstitutionType;
  state: string;
  founded: number;
  minJambCutoff: number;
  popularCourses: string[];
  facultiesCount: number;
  website: string;
  admissionNote: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['FEDERAL_UNI', 'STATE_UNI', 'PRIVATE_UNI', 'POLYTECHNIC', 'COLLEGE_OF_ED'],
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    founded: {
      type: Number,
      required: true,
    },
    minJambCutoff: {
      type: Number,
      required: true,
      min: 100,
      max: 400,
      index: true,
    },
    popularCourses: {
      type: [String],
      default: [],
    },
    facultiesCount: {
      type: Number,
      default: 1,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    admissionNote: {
      type: String,
      default: '',
      trim: true,
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

// Compound text index for search
InstitutionSchema.index({ name: 'text', shortCode: 'text', state: 'text' });

export const Institution: Model<IInstitution> =
  mongoose.models.Institution || mongoose.model<IInstitution>('Institution', InstitutionSchema);

