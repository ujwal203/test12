// src/app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const job = await JobPost.findById(id);
    return job 
      ? NextResponse.json(job)
      : NextResponse.json({ message: 'Job not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}