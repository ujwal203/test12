// src/models/ReferralCode.ts
import { Schema, model, models, Document } from 'mongoose';

// Define the interface for the ReferralCode document
export interface IReferralCode extends Document {
  code: string;
  generatedBy: Schema.Types.ObjectId; // User ID (Admin or Referrer) who generated this code
  user?: Schema.Types.ObjectId; // Optional: User ID this code is assigned to (for admin-approved accounts)
  isActive: boolean; // Can be deactivated
  singleUse: boolean; // True if it expires after one use (e.g., for initial sign-up bonus)
  expiresAt?: Date; // Optional expiry date
  createdAt: Date;
  updatedAt: Date;
}

const ReferralCodeSchema = new Schema<IReferralCode>(
  {
    code: {
      type: String,
      required: [true, 'Referral code is required'],
      unique: true, // Codes must be unique
      trim: true,
      uppercase: true, // Store codes in uppercase for consistency
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User model (the admin or referrer)
      required: [true, 'Generator user ID is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User model (the user this code is assigned to)
      required: false, // Optional, as some codes might be general-purpose
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    singleUse: {
      type: Boolean,
      default: false, // Default to multi-use for login codes
    },
    expiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const ReferralCode = models.ReferralCode || model<IReferralCode>('ReferralCode', ReferralCodeSchema);

export default ReferralCode;
