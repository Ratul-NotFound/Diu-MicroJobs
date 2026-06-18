import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';

export async function GET(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'support');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { status };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('client', 'displayName photoURL rating email department role')
        .populate('category', 'name slug icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get jobs error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'moderator');
    await connectDB();

    const body = await request.json();
    const { jobId, action, rejectionReason } = body; // action: 'approve' | 'reject'

    if (!jobId || !action) {
      return NextResponse.json({ error: 'Job ID and action are required' }, { status: 400 });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (action === 'approve') {
      updates.status = 'open';
      updates.$unset = { rejectionReason: 1 };
    } else if (action === 'reject') {
      updates.status = 'rejected';
      updates.rejectionReason = rejectionReason || 'Rejected by moderator';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, updates, { new: true })
      .populate('client', 'displayName photoURL rating')
      .populate('category', 'name slug icon');

    return NextResponse.json({ job: updatedJob, adminAction: action });
  } catch (error) {
    console.error('Admin moderate job error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
