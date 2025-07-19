// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User';

// GET function to fetch the current user's profile
export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Seekers, Referrers, and Administrators can view their own profiles
    const allowedRoles = ['Job Seeker', 'Referrer', 'Administrator', 'Job Poster'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient role' }, { status: 403 });
    }

    const user = await User.findById(session.user.id).select('-password').lean(); // Exclude password

    if (!user) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user profile', error: error.message },
      { status: 500 }
    );
  }
}

// PUT function to update the current user's profile
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Job Seekers, Referrers, and Administrators can update their own profiles
    const allowedRoles = ['Job Seeker', 'Referrer', 'Administrator', 'Job Poster'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden: Insufficient role' }, { status: 403 });
    }

    const body = await req.json();
    const { name, image, /* other profile fields like skills, experience, etc. */ } = body;

    // Build update object, only include fields that are provided
    const updateData: Partial<IUser> = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    // Add other fields you want to allow updating
    // e.g., if you add a 'bio' field to IUser: if (body.bio !== undefined) updateData.bio = body.bio;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData }, // Use $set to update specific fields
      { new: true, runValidators: true } // Return the updated document and run schema validators
    ).select('-password').lean(); // Exclude password from response

    if (!updatedUser) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Profile updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { message: 'Failed to update user profile', error: error.message },
      { status: 500 }
    );
  }
}
