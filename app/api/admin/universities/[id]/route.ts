import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import University from '@/models/University';

/**
 * GET /api/admin/universities/[id]
 * Get a single university's details.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request, 'support');
    await connectDB();
    const { id } = await params;

    const university = await University.findById(id).lean();
    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Admin get university error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/universities/[id]
 * Update a university's details.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request, 'super_admin');
    await connectDB();
    const { id } = await params;

    const university = await University.findById(id);
    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, shortName, domains, logo, departments, currency, isActive } = body;

    if (name !== undefined) university.name = name;
    if (shortName !== undefined) university.shortName = shortName;
    if (logo !== undefined) university.logo = logo;
    if (departments !== undefined) university.departments = departments;
    if (currency !== undefined) university.currency = currency;
    if (isActive !== undefined) university.isActive = isActive;

    if (domains !== undefined) {
      // Check for domain conflicts with other universities
      const conflict = await University.findOne({
        _id: { $ne: id },
        domains: { $in: domains },
      }).lean();
      if (conflict) {
        return NextResponse.json(
          { error: `Domain conflict: one or more domains are already registered to "${conflict.name}"` },
          { status: 409 }
        );
      }
      university.domains = domains.map((d: string) => d.toLowerCase());
    }

    await university.save();

    return NextResponse.json({ university, message: 'University updated successfully' });
  } catch (error) {
    console.error('Admin update university error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/universities/[id]
 * Soft-delete (deactivate) a university.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request, 'super_admin');
    await connectDB();
    const { id } = await params;

    const university = await University.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).lean();

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    return NextResponse.json({ university, message: 'University deactivated successfully' });
  } catch (error) {
    console.error('Admin delete university error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
