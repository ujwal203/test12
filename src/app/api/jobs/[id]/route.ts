import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(params.id)
      .populate('company')
      .populate('postedBy', 'name email')
      .populate('applicants', 'name email')
      .lean();

    if (!jobPost) {
      return NextResponse.json({ message: 'Job post not found' }, { status: 404 });
    }

    return NextResponse.json({ jobPost }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch job post:', error);
    return NextResponse.json(
      { message: 'Failed to fetch job post', error: error.message },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(params.id);
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

    const body = await request.json();
    const updateData: Partial<typeof jobPost> = {};

    // Update fields
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.location) updateData.location = body.location;
    if (body.jobType) updateData.jobType = body.jobType;
    if (body.experienceLevel) updateData.experienceLevel = body.experienceLevel;
    if (body.salaryRange) updateData.salaryRange = body.salaryRange;
    if (body.skillsRequired) updateData.skillsRequired = body.skillsRequired;
    if (body.applicationDeadline) {
      updateData.applicationDeadline = new Date(body.applicationDeadline);
    }
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;

    if (body.companyName) {
      let company = await mongoose.models.Company.findOne({ name: body.companyName });
      if (!company) {
        company = await mongoose.models.Company.create({ name: body.companyName });
      }
      updateData.company = company._id;
    }

    const updatedJob = await JobPost.findByIdAndUpdate(params.id, updateData, {
      new: true,
    });

    return NextResponse.json(
      { message: 'Job post updated successfully', jobPost: updatedJob },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to update job post:', error);
    return NextResponse.json(
      { message: 'Failed to update job post', error: error.message },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid Job ID' }, { status: 400 });
    }

    const jobPost = await JobPost.findById(params.id);
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

    return NextResponse.json(
      { message: 'Job post deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to delete job post:', error);
    return NextResponse.json(
      { message: 'Failed to delete job post', error: error.message },
      { status: 500 }
    );
  }
}