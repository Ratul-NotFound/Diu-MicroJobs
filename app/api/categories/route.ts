import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: { $ne: false } })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
