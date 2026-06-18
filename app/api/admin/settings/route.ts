import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';

// Mock settings storage in-memory for the MVP (can be extended to MongoDB later)
let platformSettings = {
  allowedDomains: ['diu.edu.bd', 'daffodilvarsity.edu.bd', 's.diu.edu.bd'],
  autoApproveJobs: false,
  maxJobsPerUser: 5,
  maintenanceMode: false,
};

export async function GET(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'super_admin');
    return NextResponse.json({ settings: platformSettings });
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
    const { allowedDomains, autoApproveJobs, maxJobsPerUser, maintenanceMode } = body;

    if (allowedDomains !== undefined) platformSettings.allowedDomains = allowedDomains;
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
