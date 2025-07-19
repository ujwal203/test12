// src/app/api/jobs/posted-by-user/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import JobPost from '@/models/JobPost'; // Ensure this path is correct
import dbConnect from '@/lib/dbConnect'; // Ensure this path is correct (previously connectMongoDB)

export async function GET() {
  try {
    await dbConnect(); // Use dbConnect as per your current setup

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Posters and Administrators can view this route
    if (session.user.role !== 'Job Poster' && session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Forbidden: Insufficient role' }, { status: 403 });
    }

    let query: any = {};

    // If the user is a Job Poster, filter by their user ID
    if (session.user.role === 'Job Poster') {
      query.postedBy = session.user.id;
    }
    // If the user is an Administrator, they can see all job posts
    // No specific filter needed for admin here, so query remains empty for all jobs

    const jobPosts = await JobPost.find(query)
      .populate('company') // Populate company details
      .populate('applicants', 'name email resumeUrl') // Populate name, email, and resumeUrl for applicants
      .sort({ createdAt: -1 }) // Sort by most recent first
      .lean(); // Use .lean() for plain JavaScript objects, improving performance

    return NextResponse.json({ jobPosts }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching job posts by user:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
