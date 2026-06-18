import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

export async function POST(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'moderator');
    await connectDB();

    const body = await request.json();
    const { name, slug, icon, description, subcategories, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 400 });
    }

    const category = await Category.create({
      name,
      slug,
      icon: icon || 'briefcase',
      description: description || '',
      subcategories: subcategories || [],
      order: order || 0,
      isActive: true,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Admin create category error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'moderator');
    await connectDB();

    const body = await request.json();
    const { categoryId, name, slug, icon, description, subcategories, order, isActive } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;
    if (subcategories !== undefined) updates.subcategories = subcategories;
    if (order !== undefined) updates.order = order;
    if (isActive !== undefined) updates.isActive = isActive;

    const category = await Category.findByIdAndUpdate(categoryId, updates, { new: true });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Admin update category error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { admin } = await verifyAdmin(request, 'moderator');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Soft delete: set isActive to false
    const category = await Category.findByIdAndUpdate(categoryId, { isActive: false }, { new: true });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deactivated successfully', category });
  } catch (error) {
    console.error('Admin deactivate category error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
