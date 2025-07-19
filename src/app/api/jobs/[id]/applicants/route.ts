import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Extract job ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split('/')[3]; // Gets the ID from /api/jobs/[id]/applicants

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
      });

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
  } catch (error: unknown) {
    console.error('Failed to fetch applicants:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { message: 'Internal Server Error', error: message },
      { status: 500 }
    );
  }
}