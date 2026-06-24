import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import University from '@/models/University';

// Platform settings (university domains are now managed via the University collection)
let platformSettings = {
  autoApproveJobs: false,
  maxJobsPerUser: 5,
  maintenanceMode: false,
};

export async function GET(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'super_admin');
    await connectDB();

    // Fetch allowed domains dynamically from universities
    const universities = await University.find({ isActive: true }).select('name shortName domains').lean();
    const allowedDomains = universities.flatMap((u) => u.domains);

    return NextResponse.json({
      settings: {
        ...platformSettings,
        allowedDomains,
        universities,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'super_admin');

    const body = await request.json();
    const { autoApproveJobs, maxJobsPerUser, maintenanceMode } = body;

    if (autoApproveJobs !== undefined) platformSettings.autoApproveJobs = autoApproveJobs;
    if (maxJobsPerUser !== undefined) platformSettings.maxJobsPerUser = maxJobsPerUser;
    if (maintenanceMode !== undefined) platformSettings.maintenanceMode = maintenanceMode;

    return NextResponse.json({ settings: platformSettings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
