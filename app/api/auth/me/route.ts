import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import University from '@/models/University';
import { findUniversityByEmail } from '@/lib/utils-server';

/**
 * GET /api/auth/me
 * Returns the current user's profile and admin status from MongoDB.
 */
export async function GET(request: Request) {
  try {
    const decoded = await verifyAuth(request);

    // Validate university email
    const university = await findUniversityByEmail(decoded.email || '');
    if (!university) {
      return NextResponse.json(
        { error: 'Your university is not registered on this platform' },
        { status: 403 }
      );
    }

    await connectDB();

    const [user, admin] = await Promise.all([
      User.findOne({ firebaseUid: decoded.uid })
        .populate('university', 'name shortName slug departments')
        .lean(),
      Admin.findOne({ firebaseUid: decoded.uid, status: 'active' })
        .select('firebaseUid email displayName role permissions status')
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ user: null, admin: null });
    }

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
