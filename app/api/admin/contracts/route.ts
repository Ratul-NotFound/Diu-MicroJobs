import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import Job from '@/models/Job';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/contracts
 * List all signed contracts with client, freelancer, and university details.
 */
export async function GET(request: Request) {
  try {
    await verifyAdmin(request, 'support');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Query signed contracts (exclude pending_signatures)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { status: { $ne: 'pending_signatures' } };
    
    if (status !== 'all') {
      query.status = status;
    }

    const contracts = await Contract.find(query)
      .populate('client', 'displayName email photoURL department role')
      .populate('freelancer', 'displayName email photoURL department role')
      .populate({
        path: 'job',
        select: 'title university status',
        populate: {
          path: 'university',
          select: 'name shortName',
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Admin get contracts error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/contracts
 * Override contract status to resolve disputes (force release or force refund).
 */
export async function PATCH(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'moderator');
    await connectDB();

    const body = await request.json();
    const { contractId, action } = body; // action: 'release' | 'refund'

    if (!contractId || !action) {
      return NextResponse.json({ error: 'Contract ID and override action are required' }, { status: 400 });
    }

    if (!['release', 'refund'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either release or refund' }, { status: 400 });
    }

    const contract = await Contract.findById(contractId)
      .populate('client', 'displayName')
      .populate('freelancer', 'displayName');

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.status === 'completed' || contract.status === 'cancelled') {
      return NextResponse.json({ error: 'Contract is already finalized' }, { status: 400 });
    }

    const newStatus = action === 'release' ? 'completed' : 'cancelled';
    contract.status = newStatus;
    await contract.save();

    // Sync the related job's status
    await Job.findByIdAndUpdate(contract.job, { status: newStatus });

    // Generate notifications for both parties
    const resolutionTitle = action === 'release' ? 'Dispute Resolved: Escrow Released' : 'Dispute Resolved: Escrow Refunded';
    const resolutionBody = action === 'release'
      ? `An administrator has resolved the dispute on your contract. The escrowed funds of BDT ${contract.agreedAmount} have been released to the freelancer.`
      : `An administrator has resolved the dispute on your contract. The escrowed funds of BDT ${contract.agreedAmount} have been refunded to the client.`;

    await Promise.all([
      Notification.create({
        user: contract.freelancer,
        type: 'admin_action',
        title: resolutionTitle,
        body: resolutionBody,
        link: `/contracts/${contract._id}`,
      }),
      Notification.create({
        user: contract.client,
        type: 'admin_action',
        title: resolutionTitle,
        body: resolutionBody,
        link: `/contracts/${contract._id}`,
      }),
    ]);

    return NextResponse.json({ 
      contract, 
      message: `Escrow successfully ${action === 'release' ? 'released' : 'refunded'} by ${admin.displayName}` 
    });
  } catch (error) {
    console.error('Admin resolve dispute error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
