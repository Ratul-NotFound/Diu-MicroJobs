import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Job from '@/models/Job';
import Category from '@/models/Category';

export async function GET(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'support');
    await connectDB();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalJobs,
      totalCompletedJobs,
      totalActiveJobs,
      newUsersThisMonth,
      jobsThisMonth,
      usersByRole,
      rawCategoryDistribution,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'completed' }),
      Job.countDocuments({ status: { $in: ['open', 'in_progress', 'delivered', 'revision_requested', 'contracted'] } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Job.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
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

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalJobs,
        totalCompletedJobs,
        totalActiveJobs,
        newUsersThisMonth,
        jobsThisMonth,
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
