import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import { isDiuEmail } from '@/lib/utils';

/**
 * GET /api/auth/me
 * Returns the current user's profile and admin status from MongoDB.
 */
export async function GET(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    if (decoded.email && !isDiuEmail(decoded.email)) {
      return NextResponse.json({ error: 'Only official DIU email addresses are permitted' }, { status: 403 });
    }
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return NextResponse.json({ user: null, admin: null });
    }

    // Check if user is also an admin
    const admin = await Admin.findOne({ firebaseUid: decoded.uid, status: 'active' });

    return NextResponse.json({
      user,
      admin: admin || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Unauthorized') || message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
