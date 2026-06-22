import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import Job from '@/models/Job';
import User from '@/models/User';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id: contractId } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const contract = await Contract.findById(contractId)
      .populate('job', '-attachments -thumbnail')
      .populate('client', 'displayName photoURL rating email department studentId role')
      .populate('freelancer', 'displayName photoURL rating email department studentId role')
      .lean();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify user is part of the contract
    const isClient = contract.client._id.toString() === user._id.toString();
    const isFreelancer = contract.freelancer._id.toString() === user._id.toString();

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Not authorized to view this contract' }, { status: 403 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Get contract details error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { id: contractId } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).select('_id').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const isClient = contract.client.toString() === user._id.toString();
    const isFreelancer = contract.freelancer.toString() === user._id.toString();

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Not authorized to modify this contract' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // 'sign' | 'deliver' | 'approve' | 'requestRevision'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'sign') {
      if (contract.status !== 'pending_signatures') {
        return NextResponse.json({ error: 'Contract is not pending signatures' }, { status: 400 });
      }

      if (isClient) contract.clientSigned = true;
      if (isFreelancer) contract.freelancerSigned = true;

      // If both signed, activate contract and move job to in_progress
      if (contract.clientSigned && contract.freelancerSigned) {
        contract.status = 'active';
        await Job.findByIdAndUpdate(contract.job, { status: 'in_progress' });
      }

      await contract.save();
      return NextResponse.json({ contract });
    }

    if (action === 'deliver') {
      if (!isFreelancer) {
        return NextResponse.json({ error: 'Only the freelancer can deliver work' }, { status: 403 });
      }

      if (contract.status !== 'active') {
        return NextResponse.json({ error: 'Contract is not active' }, { status: 400 });
      }

      // Update job status to delivered
      await Job.findByIdAndUpdate(contract.job, { status: 'delivered' });
      
      return NextResponse.json({ message: 'Work marked as delivered', contract });
    }

    if (action === 'approve') {
      if (!isClient) {
        return NextResponse.json({ error: 'Only the client can approve work' }, { status: 403 });
      }

      if (contract.status !== 'active') {
        return NextResponse.json({ error: 'Contract is not active' }, { status: 400 });
      }

      contract.status = 'completed';
      await contract.save();

      // Update job to completed
      await Job.findByIdAndUpdate(contract.job, { status: 'completed' });

      // Increment completedJobs for freelancer
      await User.findByIdAndUpdate(contract.freelancer, { $inc: { completedJobs: 1 } });

      return NextResponse.json({ message: 'Contract completed successfully', contract });
    }

    if (action === 'requestRevision') {
      if (!isClient) {
        return NextResponse.json({ error: 'Only the client can request revisions' }, { status: 403 });
      }

      if (contract.status !== 'active') {
        return NextResponse.json({ error: 'Contract is not active' }, { status: 400 });
      }

      // Update job status to revision_requested
      await Job.findByIdAndUpdate(contract.job, { status: 'revision_requested' });

      return NextResponse.json({ message: 'Revision requested', contract });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update contract error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
