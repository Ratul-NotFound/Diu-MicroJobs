import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import Job from '@/models/Job';
import User from '@/models/User';
import { sanitizeData } from '@/lib/security';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id: proposalId } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).select('_id').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const proposal = await Proposal.findById(proposalId).populate('job', 'client status');
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job: any = proposal.job;
    const isClient = job.client.toString() === user._id.toString();
    const isFreelancer = proposal.freelancer.toString() === user._id.toString();

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Not authorized to modify this proposal' }, { status: 403 });
    }

    const body = sanitizeData(await request.json());
    const { status, clientResponse } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (isFreelancer) {
      // Freelancer can only withdraw their own proposal
      if (status !== 'withdrawn') {
        return NextResponse.json({ error: 'Freelancers can only withdraw their proposal' }, { status: 400 });
      }
      
      if (proposal.status !== 'pending' && proposal.status !== 'shortlisted') {
        return NextResponse.json({ error: 'Cannot withdraw an accepted or rejected proposal' }, { status: 400 });
      }

      proposal.status = 'withdrawn';
      await proposal.save();

      // Decrement job proposal count
      await Job.findByIdAndUpdate(job._id, { $inc: { proposalCount: -1 } });

      return NextResponse.json({ proposal });
    }

    if (isClient) {
      // Client can accept/reject/shortlist
      if (!['accepted', 'rejected', 'shortlisted'].includes(status)) {
        return NextResponse.json({ error: 'Invalid proposal status update' }, { status: 400 });
      }

      if (proposal.status === 'accepted' || proposal.status === 'rejected' || proposal.status === 'withdrawn') {
        return NextResponse.json({ error: 'Proposal is already in a terminal state' }, { status: 400 });
      }

      proposal.status = status;
      if (clientResponse) {
        proposal.clientResponse = clientResponse;
      }

      if (status === 'accepted') {
        // Reject all other proposals for this job
        await Proposal.updateMany(
          { job: job._id, _id: { $ne: proposalId }, status: { $in: ['pending', 'shortlisted'] } },
          { $set: { status: 'rejected', clientResponse: 'Another proposal was accepted.' } }
        );

        // Update job status, and assign it
        await Job.findByIdAndUpdate(job._id, {
          status: 'accepted',
          assignedTo: proposal.freelancer,
        });
      }

      await proposal.save();
      return NextResponse.json({ proposal });
    }

    return NextResponse.json({ error: 'Action not allowed' }, { status: 400 });
  } catch (error) {
    console.error('Update proposal error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
