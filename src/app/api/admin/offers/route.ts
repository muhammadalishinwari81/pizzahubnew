import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { offers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - Fetch all offers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'active', 'inactive', 'expired'

    const offset = (page - 1) * limit;

    // Get offers with optional status filter
    let query = db.select().from(offers).orderBy(desc(offers.createdAt));
    
    if (status === 'active') {
      query = query.where(eq(offers.isActive, true));
    } else if (status === 'inactive') {
      query = query.where(eq(offers.isActive, false));
    }

    const allOffers = await query.limit(limit).offset(offset);

    // Get total count for pagination
    const totalCount = await db.select({ count: offers.id }).from(offers);

    return NextResponse.json({
      offers: allOffers,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new offer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, discountType, discountValue, validFrom, validUntil } = await request.json();

    // Validation
    if (!name || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: 'Name, discount type, discount value, valid from, and valid until are required' },
        { status: 400 }
      );
    }

    if (discountType !== 'percentage' && discountType !== 'fixed_amount') {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "fixed_amount"' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (discountType === 'fixed_amount' && discountValue <= 0) {
      return NextResponse.json(
        { error: 'Fixed amount discount must be greater than 0' },
        { status: 400 }
      );
    }

    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validUntil);

    if (validFromDate >= validUntilDate) {
      return NextResponse.json(
        { error: 'Valid from date must be before valid until date' },
        { status: 400 }
      );
    }

    // Check if offer with same name already exists
    const existingOffer = await db
      .select()
      .from(offers)
      .where(eq(offers.name, name))
      .limit(1);

    if (existingOffer.length > 0) {
      return NextResponse.json(
        { error: 'Offer with this name already exists' },
        { status: 400 }
      );
    }

    // Create offer
    const newOffer = await db
      .insert(offers)
      .values({
        name,
        description,
        discountType,
        discountValue,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      { 
        message: 'Offer created successfully',
        offer: newOffer[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update offer
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, description, discountType, discountValue, validFrom, validUntil, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // Check if offer exists
    const existingOffer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, id))
      .limit(1);

    if (existingOffer.length === 0) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Validation for discount type and value
    if (discountType && discountType !== 'percentage' && discountType !== 'fixed_amount') {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "fixed_amount"' },
        { status: 400 }
      );
    }

    if (discountValue !== undefined) {
      const finalDiscountType = discountType || existingOffer[0].discountType;
      if (finalDiscountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return NextResponse.json(
          { error: 'Percentage discount must be between 0 and 100' },
          { status: 400 }
        );
      }

      if (finalDiscountType === 'fixed_amount' && discountValue <= 0) {
        return NextResponse.json(
          { error: 'Fixed amount discount must be greater than 0' },
          { status: 400 }
        );
      }
    }

    // Validation for dates
    if (validFrom && validUntil) {
      const validFromDate = new Date(validFrom);
      const validUntilDate = new Date(validUntil);

      if (validFromDate >= validUntilDate) {
        return NextResponse.json(
          { error: 'Valid from date must be before valid until date' },
          { status: 400 }
        );
      }
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingOffer[0].name) {
      const nameConflict = await db
        .select()
        .from(offers)
        .where(eq(offers.name, name))
        .limit(1);

      if (nameConflict.length > 0) {
        return NextResponse.json(
          { error: 'Offer with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update offer
    const updatedOffer = await db
      .update(offers)
      .set({
        name,
        description,
        discountType,
        discountValue,
        validFrom: validFrom ? new Date(validFrom) : existingOffer[0].validFrom,
        validUntil: validUntil ? new Date(validUntil) : existingOffer[0].validUntil,
        isActive: isActive !== undefined ? isActive : existingOffer[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning();

    return NextResponse.json({
      message: 'Offer updated successfully',
      offer: updatedOffer[0]
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete offer
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // Check if offer exists
    const existingOffer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, id))
      .limit(1);

    if (existingOffer.length === 0) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Delete offer
    await db.delete(offers).where(eq(offers.id, id));

    return NextResponse.json({
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
