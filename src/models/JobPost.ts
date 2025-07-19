// src/models/JobPost.ts
import { Schema, model, models, Document } from 'mongoose';

// Define the interface for the JobPost document
export interface IJobPost extends Document {
  title: string;
  description: string;
  company: Schema.Types.ObjectId; // Reference to the Company model
  postedBy: Schema.Types.ObjectId; // Reference to the User (Job Poster/Admin) who posted it
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  experienceLevel: 'Entry-level' | 'Mid-level' | 'Senior-level' | 'Director' | 'Executive';
  salaryRange?: string; // e.g., "$50,000 - $70,000" or "Competitive"
  skillsRequired: string[]; // Array of strings, e.g., ['React', 'Node.js', 'MongoDB']
  applicationDeadline?: Date;
  isActive: boolean; // To easily activate/deactivate job postings
  applicants: Schema.Types.ObjectId[]; // Array of User IDs (Job Seekers) who applied
  createdAt: Date;
  updatedAt: Date;
  isFeatured?: boolean;
}

const JobPostSchema = new Schema<IJobPost>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company', // References the Company model
      required: [true, 'Company is required'],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User model (Job Poster or Admin)
      required: [true, 'Job poster is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
      required: [true, 'Job type is required'],
    },
    experienceLevel: {
      type: String,
      enum: ['Entry-level', 'Mid-level', 'Senior-level', 'Director', 'Executive'],
      required: [true, 'Experience level is required'],
    },
    salaryRange: {
      type: String,
      trim: true,
    },
    skillsRequired: {
      type: [String], // Array of strings
      default: [],
    },
    applicationDeadline: {
      type: Date,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true, // Jobs are active by default when posted
    },
    applicants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User', // References the User model (Job Seeker)
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const JobPost = models.JobPost || model<IJobPost>('JobPost', JobPostSchema);

export default JobPost;
