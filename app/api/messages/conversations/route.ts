import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import Job from '@/models/Job';
import { sanitizeData } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid }).select('_id').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find conversations where user is participant
    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate('participants', 'displayName photoURL role isOnline lastSeen')
      .populate('job', 'title budget status')
      .sort({ lastMessageAt: -1 })
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const body = sanitizeData(await request.json());
    const { participantId, jobId } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Parallel lookup and validations
    const [currentUser, targetUser, job] = await Promise.all([
      User.findOne({ firebaseUid: decoded.uid }).select('_id displayName photoURL role isOnline lastSeen university').lean(),
      User.findById(participantId).select('_id displayName photoURL role isOnline lastSeen university').lean(),
      jobId ? Job.findById(jobId).select('title budget status university').lean() : Promise.resolve(null),
    ]);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (jobId && !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Ensure they belong to the same university
    if (currentUser.university?.toString() !== targetUser.university?.toString()) {
      return NextResponse.json({ error: 'You can only message users from your own university' }, { status: 403 });
    }

    if (job && job.university?.toString() !== currentUser.university?.toString()) {
      return NextResponse.json({ error: 'Unauthorized: job belongs to another university' }, { status: 403 });
    }

    // Look for existing conversation between these exact participants
    // If a jobId is provided, check if we have one with that jobId or just generic conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      participants: { $all: [currentUser._id, targetUser._id], $size: 2 },
    };

    if (jobId) {
      query.job = jobId;
    }

    let conversation: unknown = await Conversation.findOne(query)
      .populate('participants', 'displayName photoURL role isOnline lastSeen')
      .populate('job', 'title budget status')
      .lean();

    if (!conversation) {
      // Create new conversation
      const newConv = await Conversation.create({
        participants: [currentUser._id, targetUser._id],
        job: jobId || null,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCount: {},
      });

      // Construct populated conversation in-memory to save a DB read query
      conversation = {
        ...newConv.toObject(),
        participants: [currentUser, targetUser],
        job: job || null,
      };
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
