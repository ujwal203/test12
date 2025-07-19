// src/app/api/jobs/[id]/apply/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import User from '@/models/User'; // To ensure user is a Job Seeker
import mongoose from 'mongoose';

interface Params {
  id: string; // The job post ID from the URL
}

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Seekers can apply for jobs
    if (session.user.role !== 'Job Seeker' && session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Forbidden: Only Job Seekers can apply for jobs' }, { status: 403 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    // Check if the user has already applied
    if (jobPost.applicants.includes((session.user.id as any))) { // Cast to any for comparison
      return NextResponse.json({ message: 'You have already applied for this job' }, { status: 400 });
    }

    // Add the current user's ID to the applicants array
    jobPost.applicants.push(new mongoose.Types.ObjectId(session.user.id));
    await jobPost.save();

    return NextResponse.json({ message: 'Application submitted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to apply for job ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to submit application', error: error.message },
      { status: 500 }
    );
  }
}
