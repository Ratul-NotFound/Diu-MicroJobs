import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { isDiuEmail } from '@/lib/utils';

/**
 * POST /api/auth/register
 * Creates a new user document in MongoDB after Firebase auth signup.
 */
export async function POST(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    if (decoded.email && !isDiuEmail(decoded.email)) {
      return NextResponse.json({ error: 'Only official DIU email addresses are permitted' }, { status: 403 });
    }
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: decoded.uid });
    if (existingUser) {
      return NextResponse.json({ user: existingUser }, { status: 200 });
    }

    const body = await request.json();
    const { displayName, role, department, studentId } = body;

    // Validate required fields
    if (!displayName || !role) {
      return NextResponse.json({ error: 'Display name and role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['student', 'faculty', 'alumni', 'department'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create user document
    const user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email,
      displayName,
      photoURL: decoded.picture || null,
      role,
      department: department || '',
      studentId: studentId || '',
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Unauthorized') || message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
