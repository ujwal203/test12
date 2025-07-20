import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import JobPost, { IJobPost } from '@/models/JobPost';
import mongoose from 'mongoose';

interface PopulatedJobPostForApplicants extends Omit<IJobPost, 'applicants' | 'postedBy' | 'company'> {
  applicants: Array<{
    _id: string;
    name?: string;
    email: string;
    role: 'Guest' | 'Job Seeker' | 'Job Poster' | 'Referrer' | 'Administrator';
    resumeUrl?: string;
  }>;
  postedBy: {
    _id: string;
  };
  company: mongoose.Types.ObjectId;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Extract job ID from URL
    const pathname = new URL(req.url).pathname;
    const idMatch = pathname.match(/\/jobs\/([^/]+)\/applicants/);
    const id = idMatch?.[1];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id)
      .populate({
        path: 'applicants',
        select: 'name email role resumeUrl',
      })
      .populate({
        path: 'postedBy',
        select: '_id',
      })
      .lean() as PopulatedJobPostForApplicants | null;

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'Administrator' &&
      jobPost.postedBy._id.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only view applicants for your own job posts' },
        { status: 403 }
      );
    }

    return NextResponse.json({ applicants: jobPost.applicants }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch applicants:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
