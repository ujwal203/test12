// src/models/Company.ts
import { Schema, model, models, Document } from 'mongoose';

// Define the interface for the Company document
export interface ICompany extends Document {
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  logo?: string;
  // Optional: Link to the User who registered this company (e.g., an admin or a job poster)
  registeredBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true, // Company names should ideally be unique
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 'Please fill a valid website URL'],
    },
    logoUrl: {
      type: String,
      trim: true,
      // You might add a regex for URL validation here too
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User model
      required: false, // An admin might add a company without linking to a specific poster initially
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Company = models.Company || model<ICompany>('Company', CompanySchema);

export default Company;
