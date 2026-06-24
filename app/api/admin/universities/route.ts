import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import University from '@/models/University';
import User from '@/models/User';
import Job from '@/models/Job';

/**
 * GET /api/admin/universities
 * List all universities with user and job counts.
 */
export async function GET(request: Request) {
  try {
    await verifyAdmin(request, 'support');
    await connectDB();

    const universities = await University.find().sort({ createdAt: -1 }).lean();

    // Get user and job counts per university in parallel
    const enriched = await Promise.all(
      universities.map(async (uni) => {
        const [userCount, jobCount] = await Promise.all([
          User.countDocuments({ university: uni._id }),
          Job.countDocuments({ university: uni._id }),
        ]);
        return { ...uni, userCount, jobCount };
      })
    );

    return NextResponse.json({ universities: enriched });
  } catch (error) {
    console.error('Admin get universities error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/universities
 * Add a new university.
 */
export async function POST(request: Request) {
  try {
    await verifyAdmin(request, 'super_admin');
    await connectDB();

    const body = await request.json();
    const { name, shortName, slug, domains, logo, departments, currency } = body;

    if (!name || !shortName || !slug || !domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: 'Name, short name, slug, and at least one domain are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existingSlug = await University.findOne({ slug: slug.toLowerCase() }).lean();
    if (existingSlug) {
      return NextResponse.json({ error: 'A university with this slug already exists' }, { status: 409 });
    }

    // Check for duplicate domains
    const existingDomain = await University.findOne({ domains: { $in: domains } }).lean();
    if (existingDomain) {
      return NextResponse.json(
        { error: `Domain conflict: one or more domains are already registered to "${existingDomain.name}"` },
        { status: 409 }
      );
    }

    const university = await University.create({
      name,
      shortName,
      slug: slug.toLowerCase(),
      domains: domains.map((d: string) => d.toLowerCase()),
      logo: logo || '',
      departments: departments || [],
      currency: currency || 'BDT',
      isActive: true,
    });

    return NextResponse.json({ university }, { status: 201 });
  } catch (error) {
    console.error('Admin create university error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
