import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { sanitizeData } from '@/lib/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { conversationId } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id,
    }).lean();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'displayName photoURL')
        .sort({ createdAt: -1 }) // Get newest first for pagination
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    // Reverse messages to show chronological order
    const chronologicalMessages = messages.reverse();

    // Reset unread counts for this user in the conversation
    const unreadKey = `unreadCount.${user._id.toString()}`;
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [unreadKey]: 0 },
    });

    return NextResponse.json({
      messages: chronologicalMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();
    const { conversationId } = await params;

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id,
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const body = sanitizeData(await request.json());
    const { text, attachments } = body;

    if (!text && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message text or attachments are required' }, { status: 400 });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: user._id,
      text: text || '',
      attachments: attachments || [],
      read: false,
    });

    // Update conversation details, incrementing unreadCount for other participants
    const otherParticipants = conversation.participants.filter(
      (pId) => pId.toString() !== user._id.toString()
    );

    // Build update object
    const update: Record<string, unknown> = {
      lastMessage: text || 'Sent an attachment',
      lastMessageAt: new Date(),
    };

    otherParticipants.forEach((pId) => {
      const pIdStr = pId.toString();
      const currentUnread = conversation.unreadCount.get(pIdStr) || 0;
      update[`unreadCount.${pIdStr}`] = currentUnread + 1;
    });

    await Conversation.findByIdAndUpdate(conversationId, { $set: update });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'displayName photoURL')
      .lean();

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
