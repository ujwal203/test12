import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id)
      .populate('company')
      .populate('postedBy', 'name email')
      .populate('applicants', 'name email')
      .lean();

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    return NextResponse.json({ jobPost }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to fetch job post ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to fetch job post', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    if (
      jobPost.postedBy.toString() !== session.user.id &&
      session.user.role !== 'Administrator'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only update your own job posts' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salaryRange,
      skillsRequired,
      applicationDeadline,
      isActive,
      companyName,
    } = body;

    if (title) jobPost.title = title;
    if (description) jobPost.description = description;
    if (location) jobPost.location = location;
    if (jobType) jobPost.jobType = jobType;
    if (experienceLevel) jobPost.experienceLevel = experienceLevel;
    if (salaryRange) jobPost.salaryRange = salaryRange;
    if (skillsRequired) jobPost.skillsRequired = skillsRequired;
    if (applicationDeadline) jobPost.applicationDeadline = new Date(applicationDeadline);
    if (typeof isActive === 'boolean') jobPost.isActive = isActive;

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
    console.error(`Failed to update job post ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to update job post', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(id);

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    if (
      jobPost.postedBy.toString() !== session.user.id &&
      session.user.role !== 'Administrator'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only delete your own job posts' },
        { status: 403 }
      );
    }

    await jobPost.deleteOne();

    return NextResponse.json({ message: 'Job post deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete job post ${context.params.id}:`, error);
    return NextResponse.json(
      { message: 'Failed to delete job post', error: error.message },
      { status: 500 }
    );
  }
}
