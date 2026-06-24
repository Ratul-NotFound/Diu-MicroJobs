import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import Job from '@/models/Job';
import User from '@/models/User';
import { sanitizeData } from '@/lib/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id: jobId } = await params;

    const [user, job] = await Promise.all([
      User.findOne({ firebaseUid: decoded.uid }).select('_id').lean(),
      Job.findById(jobId).select('client').lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const isClient = job.client.toString() === user._id.toString();

    // If client, return all proposals; if freelancer, return only their own
    const query = isClient 
      ? { job: jobId } 
      : { job: jobId, freelancer: user._id };

    const proposals = await Proposal.find(query)
      .populate('freelancer', 'displayName photoURL rating completedJobs department role bio skills')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Get proposals error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id: jobId } = await params;

    const [user, job] = await Promise.all([
      User.findOne({ firebaseUid: decoded.uid }).select('_id status displayName photoURL rating university').lean(),
      Job.findById(jobId).select('client status university').lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is not active' }, { status: 403 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Job is not open for proposals' }, { status: 400 });
    }

    if (job.client.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'You cannot apply to your own job' }, { status: 400 });
    }

    // Ensure the freelancer belongs to the same university
    if (user.university?.toString() !== job.university?.toString()) {
      return NextResponse.json({ error: 'You can only apply to jobs within your university' }, { status: 403 });
    }

    // Check if already applied
    const existing = await Proposal.findOne({ job: jobId, freelancer: user._id }).select('_id').lean();
    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a proposal for this job' }, { status: 400 });
    }

    const body = sanitizeData(await request.json());
    const { coverLetter, bidAmount, estimatedDuration, attachments } = body;

    if (!coverLetter || bidAmount === undefined) {
      return NextResponse.json({ error: 'Cover letter and bid amount are required' }, { status: 400 });
    }

    const proposal = await Proposal.create({
      job: jobId,
      freelancer: user._id,
      coverLetter,
      bidAmount,
      estimatedDuration: estimatedDuration || '',
      attachments: attachments || [],
      status: 'pending',
    });

    // Increment proposal count
    await Job.findByIdAndUpdate(jobId, { $inc: { proposalCount: 1 } });

    // Construct populated proposal in-memory without a separate read query
    const populated = {
      ...proposal.toObject(),
      freelancer: {
        _id: user._id,
        displayName: user.displayName,
        photoURL: user.photoURL,
        rating: user.rating,
      }
    };

    return NextResponse.json({ proposal: populated }, { status: 201 });
  } catch (error) {
    console.error('Submit proposal error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
