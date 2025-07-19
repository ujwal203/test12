// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ message: 'Database connected successfully!' });
  } catch (error: any) { // Explicitly type error as 'any' for now, or a more specific type if known
    console.error('Database connection failed:', error);
    return NextResponse.json({ message: 'Database connection failed', error: error.message }, { status: 500 });
  }
}