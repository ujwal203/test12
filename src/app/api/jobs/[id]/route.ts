// src/app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import mongoose from 'mongoose';

export function GET(request: Request, { params }: { params: { id: string } }) {
  return handleRequest('GET', request, params);
}

export function PUT(request: Request, { params }: { params: { id: string } }) {
  return handleRequest('PUT', request, params);
}

export function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handleRequest('DELETE', request, params);
}

async function handleRequest(
  method: 'GET' | 'PUT' | 'DELETE',
  request: Request,
  params: { id: string }
) {
  try {
    const { id } = params;
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    if (method === 'GET') {
      const job = await JobPost.findById(id).populate('postedBy', 'name email');
      if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });
      return NextResponse.json(job);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const job = await JobPost.findById(id);
    if (!job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    if (session.user.role !== 'Administrator' && job.postedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Forbidden: You are not allowed to perform this action' },
        { status: 403 }
      );
    }

    if (method === 'PUT') {
      const body = await request.json();
      Object.assign(job, body);
      await job.save();
      return NextResponse.json({ message: 'Job updated successfully' });
    }

    if (method === 'DELETE') {
      await JobPost.deleteOne({ _id: id });
      return NextResponse.json({ message: 'Job deleted successfully' });
    }

    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    return NextResponse.json(
      { message: `Failed to ${method.toLowerCase()} job`, error: error.message },
      { status: 500 }
    );
  }
}