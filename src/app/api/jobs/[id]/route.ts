// src/app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import mongoose from 'mongoose';

type RouteParams = { id: string };
type RouteHandler = (request: Request, context: { params: RouteParams }) => Promise<NextResponse>;

const handleRequest = async (method: string, request: Request, params: RouteParams) => {
  try {
    const { id } = params;
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    if (method === 'GET') {
      const job = await JobPost.findById(id).populate('postedBy', 'name email');
      return job 
        ? NextResponse.json(job)
        : NextResponse.json({ message: 'Job not found' }, { status: 404 });
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
      { message: `Failed to process request`, error: error.message },
      { status: 500 }
    );
  }
};

export const GET: RouteHandler = (request, { params }) => handleRequest('GET', request, params);
export const PUT: RouteHandler = (request, { params }) => handleRequest('PUT', request, params);
export const DELETE: RouteHandler = (request, { params }) => handleRequest('DELETE', request, params);