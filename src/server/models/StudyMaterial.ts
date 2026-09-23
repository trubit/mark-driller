import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IStudyMaterial extends Document {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  description: string;
  fileUrl: string;
  storageFilename: string;
  originalFilename: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  isPublished: boolean;
  isPremium: boolean;
  downloadCount: number;
  year?: number;
  sourceType?: string;
  isDummy?: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterial>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or storage key is required'],
    },
    storageFilename: {
      type: String,
      required: [true, 'Storage filename is required'],
      index: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original display filename is required'],
      default: 'document.pdf',
    },
    fileType: {
      type: String,
      default: 'pdf',
      lowercase: true,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    year: {
      type: Number,
      index: true,
    },
    sourceType: {
      type: String,
      default: 'development',
      index: true,
    },
    isDummy: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const StudyMaterial: Model<IStudyMaterial> =
  mongoose.models.StudyMaterial || mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);

