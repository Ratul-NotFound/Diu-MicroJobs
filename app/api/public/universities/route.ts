import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import University from '@/models/University';
import User from '@/models/User';
import Job from '@/models/Job';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const universities = await University.find({ isActive: true })
      .select('name shortName domains logo departments slug')
      .lean();

    // Query counts in parallel for all active universities
    const universitiesWithCounts = await Promise.all(
      universities.map(async (uni) => {
        const [userCount, jobCount] = await Promise.all([
          User.countDocuments({ university: uni._id }),
          Job.countDocuments({ university: uni._id }),
        ]);

        return {
          _id: uni._id.toString(),
          name: uni.name,
          shortName: uni.shortName,
          slug: uni.slug,
          domains: uni.domains,
          logo: uni.logo || '',
          departmentsCount: uni.departments?.length || 0,
          userCount,
          jobCount,
        };
      })
    );

    // Sort by most active universities (registrants + jobs count)
    universitiesWithCounts.sort((a, b) => (b.userCount + b.jobCount) - (a.userCount + a.jobCount));

    return NextResponse.json({ universities: universitiesWithCounts });
  } catch (error) {
    console.error('Public universities fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve active university networks' },
      { status: 500 }
    );
  }
}
