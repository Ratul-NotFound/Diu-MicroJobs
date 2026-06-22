import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Job from '@/models/Job';
import User from '@/models/User';
import Category from '@/models/Category';
import mongoose from 'mongoose';

/**
 * GET /api/jobs
 * List jobs with filtering, search, and pagination.
 */
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const status = searchParams.get('status') || 'open';
    const search = searchParams.get('search');
    const urgency = searchParams.get('urgency');
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');
    const skills = searchParams.get('skills');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (subcategory) query.subcategory = subcategory;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category }).lean();
        if (catDoc) {
          query.category = catDoc._id;
        } else {
          query.category = new mongoose.Types.ObjectId();
        }
      }
    }
    if (urgency) query.urgency = urgency;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    if (minBudget || maxBudget) {
      query['budget.min'] = {};
      if (minBudget) query['budget.min'].$gte = parseInt(minBudget);
      if (maxBudget) query['budget.min'].$lte = parseInt(maxBudget);
    }

    if (skills) {
      const skillsArr = skills.split(',').map((s) => s.trim());
      query.skills = { $in: skillsArr };
    }

    // Sort
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('client', 'displayName photoURL rating completedJobs')
        .populate('category', 'name slug icon')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/**
 * POST /api/jobs
 * Create a new job posting.
 */
export async function POST(request: Request) {
  try {
    const decoded = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is not active' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, subcategory, budget, deadline, skills, urgency, attachments, status, thumbnail } = body;

    // Validate required fields
    if (!title || !description || !category || !budget || !deadline) {
      return NextResponse.json({ error: 'Title, description, category, budget, and deadline are required' }, { status: 400 });
    }

    const job = await Job.create({
      title,
      description,
      category,
      subcategory: subcategory || '',
      budget,
      deadline: new Date(deadline),
      client: user._id,
      status: status === 'draft' ? 'draft' : 'pending_review',
      skills: skills || [],
      urgency: urgency || 'normal',
      attachments: attachments || [],
      thumbnail: thumbnail || '',
    });

    const populated = await Job.findById(job._id)
      .populate('client', 'displayName photoURL rating')
      .populate('category', 'name slug icon')
      .lean();

    return NextResponse.json({ job: populated }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Unauthorized') || message.includes('token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
