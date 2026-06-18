import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'support');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { status };

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'displayName email studentId role')
        .populate('reviewedBy', 'displayName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin get reports error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'moderator');
    await connectDB();

    const body = await request.json();
    const { reportId, status, resolution } = body; // status: 'resolved' | 'dismissed'

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Report ID and status are required' }, { status: 400 });
    }

    if (!['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid resolution status' }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    report.status = status;
    report.resolution = resolution || 'Resolved by administrator';
    report.reviewedBy = admin._id;
    await report.save();

    const populatedReport = await Report.findById(reportId)
      .populate('reporter', 'displayName email studentId role')
      .populate('reviewedBy', 'displayName role');

    return NextResponse.json({ report: populatedReport });
  } catch (error) {
    console.error('Admin resolve report error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
