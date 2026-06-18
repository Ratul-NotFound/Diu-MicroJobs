import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find conversations where user is participant
    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate('participants', 'displayName photoURL role isOnline lastSeen')
      .populate('job', 'title budget status')
      .sort({ lastMessageAt: -1 });

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

    const currentUser = await User.findOne({ firebaseUid: decoded.uid });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { participantId, jobId } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findById(participantId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
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

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'displayName photoURL role isOnline lastSeen')
      .populate('job', 'title budget status');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [currentUser._id, targetUser._id],
        job: jobId || null,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCount: {},
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'displayName photoURL role isOnline lastSeen')
        .populate('job', 'title budget status');
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
