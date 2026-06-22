import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sanitizeData } from '@/lib/security';

export async function PATCH(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = sanitizeData(await request.json());
    const { displayName, bio, skills, portfolio, department, photoURL } = body;

    const updates: Record<string, unknown> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) updates.skills = skills;
    if (portfolio !== undefined) updates.portfolio = portfolio;
    if (department !== undefined) updates.department = department;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    const updatedUser = await User.findByIdAndUpdate(user._id, updates, { new: true }).lean();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
