import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - Fetch all branches
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Get branches with optional search
    let query = db.select().from(branches).orderBy(desc(branches.createdAt));
    
    if (search) {
      query = query.where(eq(branches.name, search));
    }

    const allBranches = await query.limit(limit).offset(offset);

    // Get total count for pagination
    const totalCount = await db.select({ count: branches.id }).from(branches);

    return NextResponse.json({
      branches: allBranches,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new branch
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, address, phone, deliveryZones } = await request.json();

    // Validation
    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: 'Name, address, and phone are required' },
        { status: 400 }
      );
    }

    // Check if branch with same name already exists
    const existingBranch = await db
      .select()
      .from(branches)
      .where(eq(branches.name, name))
      .limit(1);

    if (existingBranch.length > 0) {
      return NextResponse.json(
        { error: 'Branch with this name already exists' },
        { status: 400 }
      );
    }

    // Create branch
    const newBranch = await db
      .insert(branches)
      .values({
        name,
        address,
        phone,
        deliveryZones: deliveryZones || [],
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      { 
        message: 'Branch created successfully',
        branch: newBranch[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update branch
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, address, phone, deliveryZones, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    // Check if branch exists
    const existingBranch = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    if (existingBranch.length === 0) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingBranch[0].name) {
      const nameConflict = await db
        .select()
        .from(branches)
        .where(eq(branches.name, name))
        .limit(1);

      if (nameConflict.length > 0) {
        return NextResponse.json(
          { error: 'Branch with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update branch
    const updatedBranch = await db
      .update(branches)
      .set({
        name,
        address,
        phone,
        deliveryZones: deliveryZones || existingBranch[0].deliveryZones,
        isActive: isActive !== undefined ? isActive : existingBranch[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, id))
      .returning();

    return NextResponse.json({
      message: 'Branch updated successfully',
      branch: updatedBranch[0]
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete branch
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    // Check if branch exists
    const existingBranch = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    if (existingBranch.length === 0) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // TODO: Check if branch has associated users or orders before deleting
    // For now, we'll just delete the branch
    // In a production system, you might want to deactivate instead of delete

    // Delete branch
    await db.delete(branches).where(eq(branches.id, id));

    return NextResponse.json({
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
