// src/app/api/jobs/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server'; // Keep NextRequest for consistency
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import { getServerSession } from 'next-auth';
// Assuming authOptions is now correctly exported from '@/lib/authOptions'
// If you moved authOptions, ensure it's exported from that new location.
// If not, it should be: import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { authOptions } from '@/lib/authOptions'; // User's specified import path
import mongoose from 'mongoose';

// Removed the RouteContext interface as we are inlining the type

export async function GET(request: NextRequest, context: { params: { id: string } }) { // Changed to NextRequest and context variable
  const { id } = context.params; // Destructure params inside
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
  }

  // Populate 'postedBy' to get name and email, and convert to lean object for easier typing
  const job = await JobPost.findById(id).populate('postedBy', 'name email').lean();

  if (!job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) { // Changed to NextRequest and context variable
  const { id } = context.params; // Destructure params inside
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
  }

  const body = await request.json();
  const job = await JobPost.findById(id); // Fetch as Mongoose document to use .save()

  if (!job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 });
  }

  // Ensure only the job poster or an administrator can update
  if (session.user.role !== 'Administrator' && job.postedBy.toString() !== session.user.id) {
    return NextResponse.json(
      { message: 'Forbidden: You are not allowed to update this job' },
      { status: 403 }
    );
  }

  // Update fields from the request body
  Object.assign(job, body);
  await job.save(); // Save the updated Mongoose document

  return NextResponse.json({ message: 'Job updated successfully' }, { status: 200 });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) { // Changed to NextRequest and context variable
  const { id } = context.params; // Destructure params inside
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
  }

  const job = await JobPost.findById(id); // Fetch to check ownership

  if (!job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 });
  }

  // Ensure only the job poster or an administrator can delete
  if (session.user.role !== 'Administrator' && job.postedBy.toString() !== session.user.id) {
    return NextResponse.json(
      { message: 'Forbidden: You are not allowed to delete this job' },
      { status: 403 }
    );
  }

  await JobPost.deleteOne({ _id: id });
  return NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 });
}
