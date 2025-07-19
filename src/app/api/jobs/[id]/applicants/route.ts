// src/app/api/jobs/[id]/applicants/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import JobPost, { IJobPost } from '@/models/JobPost'; // Import IJobPost for base type
import User, { IUser } from '@/models/User'; // Import IUser for applicant typing
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation

// Define a type for the job post after population and leaning
// This explicitly describes the shape returned by .lean() on populated fields
interface PopulatedJobPostForApplicants extends Omit<IJobPost, 'applicants' | 'postedBy' | 'company'> {
  // When 'applicants' is populated and leaned, it will be an array of plain objects
  // The 'select' clause determines what fields are present. _id is always present.
  applicants: Array<{
    _id: string; // Mongoose .lean() often converts ObjectId to string for populated fields
    name?: string;
    email: string;
    role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
    resumeUrl?: string;
  }>;
  // When 'postedBy' is populated with select:'_id' and leaned, it will be a plain object
  postedBy: {
    _id: string; // Mongoose .lean() often converts ObjectId to string
  };
  // 'company' is not populated in this specific query, so it remains as ObjectId
  company: mongoose.Types.ObjectId;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } } // Fixed: Explicitly define params type inline
) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Poster or Administrator can view applicants
    const allowedRoles = ['Job Poster', 'Administrator'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient role' }, { status: 403 });
    }

    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    // Find the job post and populate its applicants and postedBy
    const jobPost = await JobPost.findById(id)
      .populate({
        path: 'applicants',
        select: 'name email role resumeUrl', // Select relevant applicant fields
      })
      .populate({
        path: 'postedBy',
        select: '_id', // Only need the ID for authorization check
      })
      .lean() as PopulatedJobPostForApplicants | null; // Cast to the new interface and allow null

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    // Ensure the job poster or admin is authorized to view this specific job's applicants
    // Now jobPost.postedBy._id is correctly typed as a string
    if (session.user.role !== 'Administrator' && jobPost.postedBy._id.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden: You can only view applicants for your own job posts' }, { status: 403 });
    }

    return NextResponse.json({ applicants: jobPost.applicants }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to fetch applicants for job ID ${params.id}:`, error);
    return NextResponse.json(
      { message: `Failed to fetch applicants for job ID ${params.id}`, error: error.message },
      { status: 500 }
    );
  }
}
