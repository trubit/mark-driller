import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'STUDENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  targetExam?: Types.ObjectId;
  selectedSubjects: Types.ObjectId[];
  isVerified: boolean;
  verificationOtp?: string;
  verificationOtpExpires?: Date;
  verificationOtpAttempts: number;
  verificationOtpLastSent?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  resetPasswordOtpAttempts: number;
  resetPasswordOtpLastSent?: Date;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Do not return passwordHash in queries by default
    },
    role: {
      type: String,
      enum: ['STUDENT', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    targetExam: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
    },
    selectedSubjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationOtp: {
      type: String,
      select: false,
    },
    verificationOtpExpires: {
      type: Date,
      select: false,
    },
    verificationOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    verificationOtpLastSent: {
      type: Date,
      select: false,
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordOtpExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    resetPasswordOtpLastSent: {
      type: Date,
      select: false,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'LOCKED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.passwordHash;
        delete ret.verificationOtp;
        delete ret.verificationOtpExpires;
        delete ret.verificationOtpAttempts;
        delete ret.verificationOtpLastSent;
        delete ret.resetPasswordOtp;
        delete ret.resetPasswordOtpExpires;
        delete ret.resetPasswordOtpAttempts;
        delete ret.resetPasswordOtpLastSent;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to verify candidate password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
