// src/app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const job = await JobPost.findById(id).populate('postedBy', 'name email');

    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch job', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const body = await request.json();
    const job = await JobPost.findById(id);

    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'Administrator' &&
      job.postedBy.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You are not allowed to update this job' },
        { status: 403 }
      );
    }

    Object.assign(job, body);
    await job.save();

    return NextResponse.json({ message: 'Job updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to update job', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const job = await JobPost.findById(id);
    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'Administrator' &&
      job.postedBy.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You are not allowed to delete this job' },
        { status: 403 }
      );
    }

    await JobPost.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to delete job', error: error.message },
      { status: 500 }
    );
  }
}