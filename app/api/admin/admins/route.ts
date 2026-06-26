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

    if (!email || !displayName || !role) {
      return NextResponse.json({ error: 'Email, display name, and role are required' }, { status: 400 });
    }

    // Connect to database and check if admin doc already exists for this email
    const existing = await Admin.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 400 });
    }

    let uid = firebaseUid;
    let tempPassword = '';
    
    if (!uid) {
      // Lazy import firebase-admin auth helper
      const { adminAuth } = await import('@/lib/firebase-admin');
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Generate a safe temporary password
          tempPassword = Math.random().toString(36).slice(-8) + '!' + Math.floor(Math.random() * 10) + 'A';
          const userRecord = await adminAuth.createUser({
            email,
            displayName,
            password: tempPassword,
            emailVerified: true,
          });
          uid = userRecord.uid;
        } else {
          throw err;
        }
      }
    }

    // Now check if this firebaseUid already exists in the Admin collection
    const existingUid = await Admin.findOne({ firebaseUid: uid });
    if (existingUid) {
      return NextResponse.json({ error: 'Admin with this Firebase UID already exists' }, { status: 400 });
    }

    const newAdmin = await Admin.create({
      firebaseUid: uid,
      email,
      displayName,
      role,
      permissions: permissions || [],
      createdBy: currentAdmin._id,
      status: 'active',
    });

    return NextResponse.json({ 
      admin: newAdmin, 
      tempPassword: tempPassword || null 
    }, { status: 201 });
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
