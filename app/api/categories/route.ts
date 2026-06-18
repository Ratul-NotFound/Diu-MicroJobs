import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
