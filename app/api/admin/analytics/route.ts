import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Job from '@/models/Job';
import Category from '@/models/Category';
import Contract from '@/models/Contract';

export async function GET(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'support');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const universityFilter = searchParams.get('university');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniQuery: Record<string, any> = universityFilter ? { university: universityFilter } : {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobUniQuery: Record<string, any> = universityFilter ? { university: universityFilter } : {};

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get jobs within this university for scoping contracts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let contractFilter: Record<string, any> = {};
    if (universityFilter) {
      const jobsInUni = await Job.find({ university: universityFilter }).select('_id').lean();
      const jobIds = jobsInUni.map((j) => j._id);
      contractFilter = { job: { $in: jobIds } };
    }

    const [
      totalUsers,
      totalJobs,
      totalCompletedJobs,
      totalActiveJobs,
      newUsersThisMonth,
      jobsThisMonth,
      usersByRole,
      rawCategoryDistribution,
      financialStats,
    ] = await Promise.all([
      User.countDocuments(uniQuery),
      Job.countDocuments(jobUniQuery),
      Job.countDocuments({ ...jobUniQuery, status: 'completed' }),
      Job.countDocuments({ ...jobUniQuery, status: { $in: ['open', 'in_progress', 'delivered', 'revision_requested', 'contracted'] } }),
      User.countDocuments({ ...uniQuery, createdAt: { $gte: startOfMonth } }),
      Job.countDocuments({ ...jobUniQuery, createdAt: { $gte: startOfMonth } }),
      User.aggregate([
        { $match: uniQuery },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: jobUniQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Contract.aggregate([
        { $match: contractFilter },
        {
          $group: {
            _id: null,
            totalVolume: {
              $sum: {
                $cond: [
                  { $ne: ['$status', 'pending_signatures'] },
                  '$agreedAmount',
                  0,
                ],
              },
            },
            completedVolume: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  '$agreedAmount',
                  0,
                ],
              },
            },
            escrowedVolume: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'active'] },
                  '$agreedAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    // Populate category distribution names
    const categoryIds = rawCategoryDistribution.map((item) => item._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } }).select('name slug').lean();
    
    const categoryDistribution = rawCategoryDistribution.map((item) => {
      const cat = categories.find((c) => c._id.toString() === item._id?.toString());
      return {
        categoryId: item._id,
        name: cat ? cat.name : 'Uncategorized',
        count: item.count,
      };
    });

    const rolesData = usersByRole.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const totalVolume = financialStats[0]?.totalVolume || 0;
    const completedVolume = financialStats[0]?.completedVolume || 0;
    const escrowedVolume = financialStats[0]?.escrowedVolume || 0;
    const platformEarnings = Math.round(completedVolume * 0.10); // 10% platform fee

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalJobs,
        totalCompletedJobs,
        totalActiveJobs,
        newUsersThisMonth,
        jobsThisMonth,
        totalVolume,
        completedVolume,
        escrowedVolume,
        platformEarnings,
      },
      usersByRole: rolesData,
      categoryDistribution,
    });
  } catch (error) {
    console.error('Admin get analytics error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
