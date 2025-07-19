// src/app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import JobPost from '@/models/JobPost';
import Company from '@/models/Company'; // Import Company model
import mongoose from 'mongoose';

// GET function to fetch all job posts (or filtered)
export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only approved users can view jobs
    if (session.user.status !== 'Approved') {
      return NextResponse.json({ message: 'Forbidden: Account not approved' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || '';
    const locationFilter = searchParams.get('location') || '';
    const jobTypeFilter = searchParams.get('jobType');
    const experienceLevelFilter = searchParams.get('experienceLevel');
    const companyNameFilter = searchParams.get('companyName');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // Default sort by creation date
    const order = searchParams.get('order') === 'asc' ? 1 : -1; // Default descending

    let query: any = { isActive: true }; // Only show active jobs by default

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { skillsRequired: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (locationFilter) {
      query.location = { $regex: locationFilter, $options: 'i' };
    }
    if (jobTypeFilter && ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].includes(jobTypeFilter)) {
      query.jobType = jobTypeFilter;
    }
    if (experienceLevelFilter && ['Entry-level', 'Mid-level', 'Senior-level', 'Director', 'Executive'].includes(experienceLevelFilter)) {
      query.experienceLevel = experienceLevelFilter;
    }

    // Company Name filter (requires population or separate lookup)
    if (companyNameFilter) {
      const company = await Company.findOne({ name: { $regex: companyNameFilter, $options: 'i' } });
      if (company) {
        query.company = company._id;
      } else {
        // If company name filter is applied but no company found, return empty array
        return NextResponse.json({ jobPosts: [] }, { status: 200 });
      }
    }

    // Build sort options
    const sortOptions: { [key: string]: 1 | -1 } = {};
    if (sortBy) {
      sortOptions[sortBy] = order;
    }

    const jobPosts = await JobPost.find(query)
      .populate('company') // Populate company details
      .populate('postedBy', 'name email') // Populate postedBy for display/info
      .populate('applicants', 'name email') // Populate applicants for checking if user has applied
      .sort(sortOptions)
      .lean();

    return NextResponse.json({ jobPosts }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch job posts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch job posts', error: error.message },
      { status: 500 }
    );
  }
}

// POST function to create a new job post
export async function POST(req: Request) {
  try {
    await dbConnect(); // Connect to the database

    // Get the user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has the 'Job Poster' or 'Administrator' role
    const allowedRoles = ['Job Poster', 'Administrator'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient role' }, { status: 403 });
    }

    // Ensure user is approved
    if (session.user.status !== 'Approved') {
      return NextResponse.json({ message: 'Forbidden: Your account is not approved to post jobs.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      companyId, // We'll expect a company ID for existing companies
      companyName, // Or a new company name if creating one on the fly
      location,
      jobType,
      experienceLevel,
      salaryRange,
      skillsRequired,
      applicationDeadline,
    } = body;

    // Basic validation
    if (!title || !description || !location || !jobType || !experienceLevel || (!companyId && !companyName)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    let companyRef: string; // To store the ObjectId of the company

    if (companyId) {
      // If companyId is provided, verify it exists
      const existingCompany = await Company.findById(companyId);
      if (!existingCompany) {
        return NextResponse.json({ message: 'Company not found' }, { status: 404 });
      }
      companyRef = existingCompany._id.toString();
    } else if (companyName) {
      // If companyName is provided, check if it exists, otherwise create a new one
      let company = await Company.findOne({ name: companyName });
      if (!company) {
        company = await Company.create({
          name: companyName,
          registeredBy: session.user.id, // Link to the user who posted the job
        });
      }
      companyRef = company._id.toString();
    } else {
      return NextResponse.json({ message: 'Either companyId or companyName is required' }, { status: 400 });
    }

    // Create the new job post
    const newJobPost = await JobPost.create({
      title,
      description,
      company: companyRef, // Use the company's ObjectId
      postedBy: session.user.id, // Link to the user who posted the job
      location,
      jobType,
      experienceLevel,
      salaryRange,
      skillsRequired: skillsRequired || [], // Ensure it's an array
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      isActive: true, // Default to active
    });

    return NextResponse.json(
      { message: 'Job posted successfully', jobPost: newJobPost.toObject() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to post job:', error);
    return NextResponse.json(
      { message: 'Failed to post job', error: error.message },
      { status: 500 }
    );
  }
}
