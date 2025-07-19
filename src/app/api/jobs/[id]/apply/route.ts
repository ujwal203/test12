// src/app/api/jobs/[id]/apply/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Seekers and Admins can apply
    if (session.user.role !== 'Job Seeker' && session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Forbidden: Only Job Seekers can apply for jobs' }, { status: 403 });
    }

    // Get job ID from URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 2]; // Because URL ends with /apply/

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    if (jobPost.applicants.includes(session.user.id)) {
      return NextResponse.json({ message: 'You have already applied for this job' }, { status: 400 });
    }

    jobPost.applicants.push(new mongoose.Types.ObjectId(session.user.id));
    await jobPost.save();

    return NextResponse.json({ message: 'Application submitted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to apply for job:`, error);
    return NextResponse.json(
      { message: 'Failed to submit application', error: error.message },
      { status: 500 }
    );
  }
}
