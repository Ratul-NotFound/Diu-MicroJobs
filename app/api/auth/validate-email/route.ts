import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import University from '@/models/University';
import { getEmailDomain } from '@/lib/utils';

/**
 * POST /api/auth/validate-email
 * Checks if an email domain belongs to a supported university.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, error: 'Email is required' }, { status: 400 });
    }

    await connectDB();
    const domain = getEmailDomain(email);

    if (!domain) {
      return NextResponse.json({ valid: false, error: 'Invalid email format' }, { status: 400 });
    }

    const university = await University.findOne({ domains: domain, isActive: true })
      .select('name shortName slug departments')
      .lean();

    if (!university) {
      return NextResponse.json({
        valid: false,
        error: 'Your university is not registered on this platform. Contact your university administration to get added.',
      });
    }

    return NextResponse.json({
      valid: true,
      university: {
        _id: university._id,
        name: university.name,
        shortName: university.shortName,
        slug: university.slug,
        departments: university.departments,
      },
    });
  } catch (error) {
    console.error('Validate email error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}
