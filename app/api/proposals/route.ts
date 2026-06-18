import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { freelancer: user._id };
    if (status) {
      query.status = status;
    }

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate({
          path: 'job',
          select: 'title budget deadline status client',
          populate: {
            path: 'client',
            select: 'displayName photoURL',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Proposal.countDocuments(query),
    ]);

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user proposals error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
