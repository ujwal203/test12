// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
// import ReferralCode from '@/models/ReferralCode'; // ReferralCode is no longer used directly here

export async function POST(req: Request) {
  try {
    await dbConnect(); // Ensure DB connection

    const { name, email, password, role } = await req.json(); // Get role from request

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Name, email, password, and desired role are required' },
        { status: 400 }
      );
    }

    // 1. Validate Email (simple regex)
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    // 3. Create new user with 'Pending' status
    const newUser = await User.create({
      name,
      email,
      password, // Mongoose pre-save hook will hash this
      role: role, // Set the desired role
      status: 'Pending', // All new registrations start as pending
      // referralCodeUsed and referralExpiresAt are NOT set here
    });

    // We don't need to return password or sensitive info
    const userResponse = newUser.toObject();
    delete userResponse.password; // Explicitly remove password from response

    return NextResponse.json(
      { message: 'Registration request submitted successfully. Please wait for admin approval.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration failed:', error);
    return NextResponse.json(
      { message: 'Registration failed', error: error.message },
      { status: 500 }
    );
  }
}
