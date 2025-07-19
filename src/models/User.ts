// src/models/User.ts
import { Schema, model, models, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

// Define the interface for the User document
export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; // Stored hashed, but now optional as login is via referral code
  image?: string;
  role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
  status: 'Pending' | 'Approved' | 'Rejected'; // Account status
  referralCodeUsed?: string; // The code used for login after approval
  referralExpiresAt?: Date; // When the access granted by the referral code expires
  resumeUrl?: string; // Path to the uploaded resume file
  // NEW: Add createdAt and updatedAt explicitly for TypeScript
  createdAt: Date;
  updatedAt: Date;
  // Fields added by NextAuth.js (for MongoDB adapter):
  emailVerified?: Date;
  accounts?: Array<{
    provider: string;
    type: string;
    providerAccountId: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
    session_state?: string;
  }>;
  sessions?: Array<{
    sessionToken: string;
    expires: Date;
  }>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    image: { type: String },
    role: {
      type: String,
      enum: ['Guest', 'Job Seeker', 'Job Poster', 'Referrer', 'Administrator'],
      default: 'Guest',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      required: true,
    },
    referralCodeUsed: { type: String },
    referralExpiresAt: { type: Date },
    resumeUrl: { type: String },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically by Mongoose
  }
);

// Add a pre-save hook for password hashing (for direct registration, if password is provided)
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = models.User || model<IUser>('User', UserSchema);

export default User;
