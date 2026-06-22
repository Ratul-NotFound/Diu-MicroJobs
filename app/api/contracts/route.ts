import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import Proposal from '@/models/Proposal';
import Job from '@/models/Job';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid }).select('_id').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find contracts where user is either client or freelancer
    const query = {
      $or: [
        { client: user._id },
        { freelancer: user._id },
      ],
    };

    const contracts = await Contract.find(query)
      .populate('job', 'title budget deadline status client')
      .populate('client', 'displayName photoURL rating')
      .populate('freelancer', 'displayName photoURL rating')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Get contracts error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid }).select('_id').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { jobId, proposalId, terms, agreedAmount, deadline, deliverables, milestones } = body;

    if (!jobId || !proposalId || !agreedAmount || !deadline) {
      return NextResponse.json({ error: 'Job ID, proposal ID, agreed amount, and deadline are required' }, { status: 400 });
    }

    const [job, proposal] = await Promise.all([
      Job.findById(jobId).lean(),
      Proposal.findById(proposalId).lean()
    ]);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.client.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Only the job owner can create a contract' }, { status: 403 });
    }

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'accepted') {
      return NextResponse.json({ error: 'Proposal must be accepted first' }, { status: 400 });
    }

    const contract = await Contract.create({
      job: jobId,
      proposal: proposalId,
      client: user._id,
      freelancer: proposal.freelancer,
      terms,
      agreedAmount,
      deadline: new Date(deadline),
      deliverables: deliverables || [],
      milestones: milestones || [],
      status: 'pending_signatures',
    });

    // Update job status
    await Job.findByIdAndUpdate(jobId, { status: 'contracted' });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error('Create contract error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
