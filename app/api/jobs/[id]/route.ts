import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import User from '@/models/User';
import { sanitizeData } from '@/lib/security';

/**
 * GET /api/jobs/[id]
 * Get a single job by ID with full details.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).select('_id university').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const job = await Job.findById(id)
      .populate('client', 'displayName photoURL rating completedJobs department role bio')
      .populate('category', 'name slug icon')
      .populate('assignedTo', 'displayName photoURL rating')
      .lean();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify university matches
    if (job.university?.toString() !== user.university?.toString()) {
      return NextResponse.json({ error: 'Unauthorized: this job belongs to another university' }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Unauthorized') || message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update a job (owner or admin only).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const job = await Job.findById(id).lean();
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only the client (owner) can update their own job
    if (job.client.toString() !== user._id.toString() || job.university?.toString() !== user.university?.toString()) {
      return NextResponse.json({ error: 'Not authorized to update this job' }, { status: 403 });
    }

    const body = sanitizeData(await request.json());

    // Validate status updates
    if (body.status !== undefined) {
      const allowedStatusTransitions = ['draft', 'pending_review', 'cancelled'];
      if (!allowedStatusTransitions.includes(body.status)) {
        return NextResponse.json({ error: 'Directly transitioning to this status is not allowed' }, { status: 400 });
      }

      if (['contracted', 'in_progress', 'delivered', 'completed', 'disputed'].includes(job.status)) {
        return NextResponse.json({ error: 'Cannot change status of an active contract or completed job' }, { status: 400 });
      }
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'subcategory', 'budget',
      'deadline', 'skills', 'urgency', 'attachments', 'status',
      'cancellationReason',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    updates.updatedAt = new Date();

    const updatedJob = await Job.findByIdAndUpdate(id, updates, { new: true })
      .populate('client', 'displayName photoURL rating')
      .populate('category', 'name slug icon')
      .lean();

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Unauthorized') || message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job (owner only, only if draft or no proposals).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const job = await Job.findById(id).lean();
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.client.toString() !== user._id.toString() || job.university?.toString() !== user.university?.toString()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (!['draft', 'pending_review'].includes(job.status)) {
      return NextResponse.json({ error: 'Can only delete draft or pending jobs' }, { status: 400 });
    }

    await Job.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Unauthorized') || message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
