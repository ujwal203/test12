// src/app/api/jobs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';

interface Params {
  id: string; // The job post ID from the URL
}

// Existing GET function (if any) should remain here
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id)
      .populate('company')
      .populate('postedBy', 'name email') // Populate postedBy to check ownership
      .populate('applicants', 'name email') // Populate applicants for job details page
      .lean();

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    return NextResponse.json({ jobPost }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to fetch job post ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to fetch job post', error: error.message },
      { status: 500 }
    );
  }
}

// Existing PUT function (if any) should remain here
export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    // Authorization check: Only the job poster or an administrator can update
    if (jobPost.postedBy.toString() !== session.user.id && session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Forbidden: You can only update your own job posts' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, location, jobType, experienceLevel, salaryRange, skillsRequired, applicationDeadline, isActive, companyName } = body;

    // Update fields based on provided body
    if (title) jobPost.title = title;
    if (description) jobPost.description = description;
    if (location) jobPost.location = location;
    if (jobType) jobPost.jobType = jobType;
    if (experienceLevel) jobPost.experienceLevel = experienceLevel;
    if (salaryRange) jobPost.salaryRange = salaryRange;
    if (skillsRequired) jobPost.skillsRequired = skillsRequired;
    if (applicationDeadline) jobPost.applicationDeadline = new Date(applicationDeadline);
    if (typeof isActive === 'boolean') jobPost.isActive = isActive;

    // Handle companyName update: find or create company
    if (companyName) {
      let company = await mongoose.models.Company.findOne({ name: companyName });
      if (!company) {
        company = await mongoose.models.Company.create({ name: companyName });
      }
      jobPost.company = company._id;
    }

    await jobPost.save();

    return NextResponse.json({ message: 'Job post updated successfully', jobPost }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update job post ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to update job post', error: error.message },
      { status: 500 }
    );
  }
}


// NEW: DELETE function
export async function DELETE(req: Request, { params }: { params: Params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    // Authorization check: Only the job poster or an administrator can delete
    if (jobPost.postedBy.toString() !== session.user.id && session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Forbidden: You can only delete your own job posts' }, { status: 403 });
    }

    await jobPost.deleteOne(); // Use deleteOne() for Mongoose 6+

    return NextResponse.json({ message: 'Job post deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete job post ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to delete job post', error: error.message },
      { status: 500 }
    );
  }
}
