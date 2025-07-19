// src/app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';

// Workaround for Next.js type checking
const handler = {
  GET: async (req: Request) => {
    try {
      await dbConnect();
      const id = new URL(req.url).pathname.split('/').pop();
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
      }

      const job = await JobPost.findById(id).populate('postedBy', 'name email');
      return job 
        ? NextResponse.json(job)
        : NextResponse.json({ message: 'Job not found' }, { status: 404 });
    } catch (error) {
      return NextResponse.json(
        { message: 'Server error' },
        { status: 500 }
      );
    }
  },
  PUT: async (req: Request) => {
    try {
      await dbConnect();
      const id = new URL(req.url).pathname.split('/').pop();
      // ... rest of your PUT logic
    } catch (error) {
      // error handling
    }
  },
  DELETE: async (req: Request) => {
    try {
      await dbConnect();
      const id = new URL(req.url).pathname.split('/').pop();
      // ... rest of your DELETE logic
    } catch (error) {
      // error handling
    }
  }
};

export const GET = handler.GET;
export const PUT = handler.PUT;
export const DELETE = handler.DELETE;