import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Job from '@/models/Job';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const [userCount, completedJobCount, distinctDeps, reviewStats] = await Promise.all([
      // Count active users on the platform
      User.countDocuments({ status: 'active' }),
      // Count completed projects/jobs
      Job.countDocuments({ status: 'completed' }),
      // Get unique university departments
      User.distinct('department'),
      // Calculate overall platform rating average
      Review.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const activeDepsCount = distinctDeps.filter((d) => d && d.trim().length > 0).length;
    const avgRating = reviewStats.length > 0 ? parseFloat(reviewStats[0].avgRating.toFixed(1)) : 4.9;

    return NextResponse.json({
      registeredStudents: userCount,
      completedJobs: completedJobCount,
      satisfactionRate: `${Math.round((avgRating / 5) * 100)}%`,
      departmentsCount: activeDepsCount || 1,
      avgRating,
    });
  } catch (error) {
    console.error('Public stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stats' },
      { status: 500 }
    );
  }
}
