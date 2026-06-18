import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Contract from '@/models/Contract';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get('revieweeId');
    const jobId = searchParams.get('jobId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (revieweeId) query.reviewee = revieweeId;
    if (jobId) query.job = jobId;

    const reviews = await Review.find(query)
      .populate('reviewer', 'displayName photoURL role')
      .populate('reviewee', 'displayName photoURL role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const currentUser = await User.findOne({ firebaseUid: decoded.uid });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { jobId, contractId, revieweeId, rating, communication, quality, timeliness, comment } = body;

    if (!jobId || !contractId || !revieweeId || !rating) {
      return NextResponse.json({ error: 'Job ID, contract ID, reviewee ID, and rating are required' }, { status: 400 });
    }

    // Check if contract exists and is completed
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.status !== 'completed') {
      return NextResponse.json({ error: 'Reviews can only be submitted for completed contracts' }, { status: 400 });
    }

    // Verify reviewer is part of the contract
    const isClient = contract.client.toString() === currentUser._id.toString();
    const isFreelancer = contract.freelancer.toString() === currentUser._id.toString();

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'You are not authorized to review this contract' }, { status: 403 });
    }

    // Check if reviewer already left a review for this contract
    const existing = await Review.findOne({
      contract: contractId,
      reviewer: currentUser._id,
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this contract' }, { status: 400 });
    }

    // Create review
    const review = await Review.create({
      job: jobId,
      contract: contractId,
      reviewer: currentUser._id,
      reviewee: revieweeId,
      rating,
      communication: communication || rating,
      quality: quality || rating,
      timeliness: timeliness || rating,
      comment: comment || '',
    });

    // Update reviewee rating average and totalReviews
    // Calculate new values using aggregation
    const revieweeObjectId = new mongoose.Types.ObjectId(revieweeId);
    const stats = await Review.aggregate([
      { $match: { reviewee: revieweeObjectId } },
      {
        $group: {
          _id: '$reviewee',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const newRating = parseFloat(stats[0].avgRating.toFixed(1));
      const totalReviews = stats[0].count;
      await User.findByIdAndUpdate(revieweeId, {
        rating: newRating,
        totalReviews,
      });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
