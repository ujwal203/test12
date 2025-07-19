// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import ReferralCode from '@/models/ReferralCode';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email'; // Import the new email utility

// Removed the old sendReferralEmail simulation function

// GET function to fetch users (e.g., pending users for approval)
export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'Pending';

    const users = await User.find({ status: statusFilter }).select('-password').lean();

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
}

// PUT function to approve or reject a user
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'Administrator') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await req.json();

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid request: userId and action are required' }, { status: 400 });
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (action === 'approve') {
      if (userToUpdate.status === 'Approved') {
        return NextResponse.json({ message: 'User already approved' }, { status: 400 });
      }

      const referralCode = crypto.randomBytes(8).toString('hex').toUpperCase();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      userToUpdate.status = 'Approved';
      userToUpdate.referralCodeUsed = referralCode;
      userToUpdate.referralExpiresAt = expiryDate;

      await userToUpdate.save();

      await ReferralCode.create({
        code: referralCode,
        generatedBy: session.user.id,
        user: userToUpdate._id,
        isActive: true,
        singleUse: false,
        expiresAt: expiryDate,
      });

      // Send real email
      const emailSent = await sendEmail({
        to: userToUpdate.email,
        subject: 'Your Udyog Jagat Account is Approved!',
        text: `Dear ${userToUpdate.name || 'User'},\n\nYour Udyog Jagat registration request has been approved!\n\nYou can now log in using your email and the following referral code:\n\nReferral Code: ${referralCode}\n\nThis code is valid until: ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()}\n\nPlease keep this code safe. You will need it every time you log in.\n\nLogin here: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login\n\nThank you,\nUdyog Jagat Team`,
        html: `
          <p>Dear ${userToUpdate.name || 'User'},</p>
          <p>Your Udyog Jagat registration request has been approved!</p>
          <p>You can now log in using your email and the following referral code:</p>
          <p><strong>Referral Code: ${referralCode}</strong></p>
          <p>This code is valid until: ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()}</p>
          <p>Please keep this code safe. You will need it every time you log in.</p>
          <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login">Click here to Login</a></p>
          <p>Thank you,</p>
          <p>Udyog Jagat Team</p>
        `,
      });

      if (!emailSent) {
        console.error('Failed to send approval email to', userToUpdate.email);
        // You might want to handle this error more gracefully, e.g., log it for manual review
      }

      return NextResponse.json(
        { message: 'User approved and referral code sent', user: userToUpdate.toObject() },
        { status: 200 }
      );
    } else if (action === 'reject') {
      if (userToUpdate.status === 'Rejected') {
        return NextResponse.json({ message: 'User already rejected' }, { status: 400 });
      }
      userToUpdate.status = 'Rejected';
      userToUpdate.referralCodeUsed = undefined;
      userToUpdate.referralExpiresAt = undefined;
      await userToUpdate.save();

      // Optional: Send rejection email
      await sendEmail({
        to: userToUpdate.email,
        subject: 'Your Udyog Jagat Registration Request Status',
        text: `Dear ${userToUpdate.name || 'User'},\n\nWe regret to inform you that your Udyog Jagat registration request has been rejected. If you believe this is an error, please contact support.\n\nThank you,\nUdyog Jagat Team`,
        html: `
          <p>Dear ${userToUpdate.name || 'User'},</p>
          <p>We regret to inform you that your Udyog Jagat registration request has been rejected.</p>
          <p>If you believe this is an error, please contact support.</p>
          <p>Thank you,</p>
          <p>Udyog Jagat Team</p>
        `,
      });

      return NextResponse.json(
        { message: 'User rejected', user: userToUpdate.toObject() },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update user status:', error);
    return NextResponse.json(
      { message: 'Failed to update user status', error: error.message },
      { status: 500 }
    );
  }
}
