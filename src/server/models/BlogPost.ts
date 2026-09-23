import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type BlogCategory =
  | 'JAMB_GUIDES'
  | 'WAEC_INSIGHTS'
  | 'NECO_EXCELLENCE'
  | 'GCE_PREP'
  | 'NABTEB_STRATEGY'
  | 'POST_UTME'
  | 'STUDY_TECHNIQUES';

export type ExamBoard =
  | 'JAMB'
  | 'WAEC'
  | 'NECO'
  | 'GCE'
  | 'NABTEB'
  | 'POST-UTME'
  | 'GENERAL';

export interface IBlogPost extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  category: BlogCategory;
  examBoard: ExamBoard;
  author: string;
  authorRole: string;
  publishedDate: string;
  readTime: string;
  summary: string;
  content: string[];
  tags: string[];
  imageUrl?: string;
  imageCaption?: string;
  keyTakeaways?: string[];
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'JAMB_GUIDES',
        'WAEC_INSIGHTS',
        'NECO_EXCELLENCE',
        'GCE_PREP',
        'NABTEB_STRATEGY',
        'POST_UTME',
        'STUDY_TECHNIQUES',
      ],
      required: true,
      index: true,
    },
    examBoard: {
      type: String,
      enum: ['JAMB', 'WAEC', 'NECO', 'GCE', 'NABTEB', 'POST-UTME', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorRole: {
      type: String,
      required: true,
      trim: true,
    },
    publishedDate: {
      type: String,
      required: true,
    },
    readTime: {
      type: String,
      default: '5 min read',
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: [String],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageCaption: {
      type: String,
      trim: true,
      default: '',
    },
    keyTakeaways: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

BlogPostSchema.index({ title: 'text', summary: 'text', tags: 'text' });

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

