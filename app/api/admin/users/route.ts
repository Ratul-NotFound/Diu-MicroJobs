import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const university = searchParams.get('university');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (university) query.university = university;

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-portfolio -skills -bio')
        .populate('university', 'name shortName slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await verifyAdmin(request, 'moderator');
    await connectDB();

    const body = await request.json();
    const { userId, action, reason } = body; // action: 'suspend' | 'ban' | 'activate' | 'verify'

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    const targetUser = await User.findById(userId).select('_id').lean();
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (action === 'suspend') {
      updates.status = 'suspended';
      updates.suspensionReason = reason || 'Suspended by administrator';
    } else if (action === 'ban') {
      updates.status = 'banned';
      updates.suspensionReason = reason || 'Banned by administrator';
    } else if (action === 'activate') {
      updates.status = 'active';
      updates.$unset = { suspensionReason: 1 };
    } else if (action === 'verify') {
      updates.isVerified = true;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).lean();

    return NextResponse.json({ user: updatedUser, adminAction: action });
  } catch (error) {
    console.error('Admin patch user error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
