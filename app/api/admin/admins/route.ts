import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function GET(request: Request) {
  try {
    // Super admin authentication required
    const { admin } = await verifyAdmin(request, 'super_admin');
    await connectDB();

    const admins = await Admin.find()
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { admin: currentAdmin } = await verifyAdmin(request, 'super_admin');
    await connectDB();

    const body = await request.json();
    const { firebaseUid, email, displayName, role, permissions } = body;

    if (!firebaseUid || !email || !displayName || !role) {
      return NextResponse.json({ error: 'Firebase UID, email, display name, and role are required' }, { status: 400 });
    }

    const existing = await Admin.findOne({ $or: [{ firebaseUid }, { email }] });
    if (existing) {
      return NextResponse.json({ error: 'Admin with this UID or email already exists' }, { status: 400 });
    }

    const newAdmin = await Admin.create({
      firebaseUid,
      email,
      displayName,
      role,
      permissions: permissions || [],
      createdBy: currentAdmin._id,
      status: 'active',
    });

    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin: currentAdmin } = await verifyAdmin(request, 'super_admin');
    await connectDB();

    const body = await request.json();
    const { adminId, role, permissions, status } = body;

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    const targetAdmin = await Admin.findById(adminId);
    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin document not found' }, { status: 404 });
    }

    // Prevent demoting the last super admin
    if (targetAdmin.role === 'super_admin' && role !== 'super_admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super_admin', status: 'active' });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last active super admin' }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (status !== undefined) updates.status = status;

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updates, { new: true });

    return NextResponse.json({ admin: updatedAdmin });
  } catch (error) {
    console.error('Update admin error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
