// src/app/api/jobs/[id]/applicants/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import JobPost, { IJobPost } from '@/models/JobPost'; // Import IJobPost
import { IUser } from '@/models/User'; // Import IUser for applicant typing
import mongoose from 'mongoose';

interface Params {
  id: string; // The job post ID from the URL
}

// Define the expected shape of the jobPost after population and .lean() for this specific API
// This explicitly tells TypeScript that 'applicants' and 'postedBy' will be populated objects
interface PopulatedJobPostForApplicantsAPI extends Omit<IJobPost, 'applicants' | 'postedBy' | 'company'> {
  applicants: Array<IUser>; // Expect full User objects here
  postedBy: { _id: mongoose.Types.ObjectId; email: string; name?: string; }; // Expect minimal postedBy info for ownership check
  company: { _id: mongoose.Types.ObjectId; name: string; /* add other company fields if needed */ }; // Minimal company info
}

export async function GET(req: Request, { params }: { params: Params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Posters and Administrators can view applicants
    const allowedRoles = ['Job Poster', 'Administrator'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient role to view applicants' }, { status: 403 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    // Find the job post and populate its applicants and postedBy
    const jobPost = await JobPost.findById(id)
      .populate({
        path: 'applicants', // Populate the applicants array
        select: 'name email resumeUrl', // Select relevant user fields for applicants
      })
      .populate({
        path: 'postedBy', // Also populate postedBy to check ownership
        select: '_id email name', // Select necessary fields for postedBy
      })
      .lean() as PopulatedJobPostForApplicantsAPI | null; // Cast the result to our defined interface

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    // Authorization check: Job Poster can only view applicants for their own jobs
    // Now jobPost.postedBy._id is correctly typed
    if (session.user.role === 'Job Poster' && jobPost.postedBy._id.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden: You can only view applicants for your own job posts' }, { status: 403 });
    }

    // jobPost.applicants is now correctly typed as Array<IUser>
    return NextResponse.json({ applicants: jobPost.applicants }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to fetch applicants for job ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to fetch applicants', error: error.message },
      { status: 500 }
    );
  }
}
