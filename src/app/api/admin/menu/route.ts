import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { pizzas, toppings, pizzaToppings, branches } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET - Fetch all pizzas and toppings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'pizzas' or 'toppings'
    const branchId = searchParams.get('branchId');

    if (type === 'pizzas') {
      // Get pizzas with branch information
      let query = db
        .select({
          id: pizzas.id,
          name: pizzas.name,
          description: pizzas.description,
          basePrice: pizzas.basePrice,
          imageUrl: pizzas.imageUrl,
          isAvailable: pizzas.isAvailable,
          branchId: pizzas.branchId,
          createdAt: pizzas.createdAt,
          updatedAt: pizzas.updatedAt,
          branchName: branches.name,
        })
        .from(pizzas)
        .leftJoin(branches, eq(pizzas.branchId, branches.id))
        .orderBy(desc(pizzas.createdAt));

      if (branchId) {
        query = query.where(eq(pizzas.branchId, branchId));
      }

      const allPizzas = await query;

      return NextResponse.json({ pizzas: allPizzas });
    } else if (type === 'toppings') {
      // Get all toppings
      const allToppings = await db
        .select()
        .from(toppings)
        .orderBy(desc(toppings.createdAt));

      return NextResponse.json({ toppings: allToppings });
    } else {
      // Get both pizzas and toppings
      const [allPizzas, allToppings] = await Promise.all([
        db
          .select({
            id: pizzas.id,
            name: pizzas.name,
            description: pizzas.description,
            basePrice: pizzas.basePrice,
            imageUrl: pizzas.imageUrl,
            isAvailable: pizzas.isAvailable,
            branchId: pizzas.branchId,
            createdAt: pizzas.createdAt,
            updatedAt: pizzas.updatedAt,
            branchName: branches.name,
          })
          .from(pizzas)
          .leftJoin(branches, eq(pizzas.branchId, branches.id))
          .orderBy(desc(pizzas.createdAt)),
        db.select().from(toppings).orderBy(desc(toppings.createdAt)),
      ]);

      return NextResponse.json({ pizzas: allPizzas, toppings: allToppings });
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new pizza or topping
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, ...data } = await request.json();

    if (type === 'pizza') {
      const { name, description, basePrice, imageUrl, branchId, toppingIds } = data;

      // Validation
      if (!name || !basePrice || !branchId) {
        return NextResponse.json(
          { error: 'Name, base price, and branch are required' },
          { status: 400 }
        );
      }

      // Check if pizza with same name in same branch already exists
      const existingPizza = await db
        .select()
        .from(pizzas)
        .where(and(eq(pizzas.name, name), eq(pizzas.branchId, branchId)))
        .limit(1);

      if (existingPizza.length > 0) {
        return NextResponse.json(
          { error: 'Pizza with this name already exists in this branch' },
          { status: 400 }
        );
      }

      // Create pizza
      const newPizza = await db
        .insert(pizzas)
        .values({
          name,
          description,
          basePrice,
          imageUrl,
          branchId,
          isAvailable: true,
        })
        .returning();

      // Add toppings if provided
      if (toppingIds && toppingIds.length > 0) {
        const pizzaToppingValues = toppingIds.map((toppingId: string) => ({
          pizzaId: newPizza[0].id,
          toppingId,
        }));

        await db.insert(pizzaToppings).values(pizzaToppingValues);
      }

      return NextResponse.json(
        { 
          message: 'Pizza created successfully',
          pizza: newPizza[0]
        },
        { status: 201 }
      );
    } else if (type === 'topping') {
      const { name, price, category } = data;

      // Validation
      if (!name || !price || !category) {
        return NextResponse.json(
          { error: 'Name, price, and category are required' },
          { status: 400 }
        );
      }

      // Check if topping with same name already exists
      const existingTopping = await db
        .select()
        .from(toppings)
        .where(eq(toppings.name, name))
        .limit(1);

      if (existingTopping.length > 0) {
        return NextResponse.json(
          { error: 'Topping with this name already exists' },
          { status: 400 }
        );
      }

      // Create topping
      const newTopping = await db
        .insert(toppings)
        .values({
          name,
          price,
          category,
          isAvailable: true,
        })
        .returning();

      return NextResponse.json(
        { 
          message: 'Topping created successfully',
          topping: newTopping[0]
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "pizza" or "topping"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update pizza or topping
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (type === 'pizza') {
      const { name, description, basePrice, imageUrl, branchId, isAvailable, toppingIds } = data;

      // Check if pizza exists
      const existingPizza = await db
        .select()
        .from(pizzas)
        .where(eq(pizzas.id, id))
        .limit(1);

      if (existingPizza.length === 0) {
        return NextResponse.json(
          { error: 'Pizza not found' },
          { status: 404 }
        );
      }

      // Check if name is being changed and if it conflicts
      if (name && name !== existingPizza[0].name) {
        const nameConflict = await db
          .select()
          .from(pizzas)
          .where(and(eq(pizzas.name, name), eq(pizzas.branchId, branchId || existingPizza[0].branchId)))
          .limit(1);

        if (nameConflict.length > 0) {
          return NextResponse.json(
            { error: 'Pizza with this name already exists in this branch' },
            { status: 400 }
          );
        }
      }

      // Update pizza
      const updatedPizza = await db
        .update(pizzas)
        .set({
          name,
          description,
          basePrice,
          imageUrl,
          branchId,
          isAvailable: isAvailable !== undefined ? isAvailable : existingPizza[0].isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(pizzas.id, id))
        .returning();

      // Update toppings if provided
      if (toppingIds) {
        // Remove existing toppings
        await db.delete(pizzaToppings).where(eq(pizzaToppings.pizzaId, id));

        // Add new toppings
        if (toppingIds.length > 0) {
          const pizzaToppingValues = toppingIds.map((toppingId: string) => ({
            pizzaId: id,
            toppingId,
          }));

          await db.insert(pizzaToppings).values(pizzaToppingValues);
        }
      }

      return NextResponse.json({
        message: 'Pizza updated successfully',
        pizza: updatedPizza[0]
      });
    } else if (type === 'topping') {
      const { name, price, category, isAvailable } = data;

      // Check if topping exists
      const existingTopping = await db
        .select()
        .from(toppings)
        .where(eq(toppings.id, id))
        .limit(1);

      if (existingTopping.length === 0) {
        return NextResponse.json(
          { error: 'Topping not found' },
          { status: 404 }
        );
      }

      // Check if name is being changed and if it conflicts
      if (name && name !== existingTopping[0].name) {
        const nameConflict = await db
          .select()
          .from(toppings)
          .where(eq(toppings.name, name))
          .limit(1);

        if (nameConflict.length > 0) {
          return NextResponse.json(
            { error: 'Topping with this name already exists' },
            { status: 400 }
          );
        }
      }

      // Update topping
      const updatedTopping = await db
        .update(toppings)
        .set({
          name,
          price,
          category,
          isAvailable: isAvailable !== undefined ? isAvailable : existingTopping[0].isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(toppings.id, id))
        .returning();

      return NextResponse.json({
        message: 'Topping updated successfully',
        topping: updatedTopping[0]
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "pizza" or "topping"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pizza or topping
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json(
        { error: 'ID and type are required' },
        { status: 400 }
      );
    }

    if (type === 'pizza') {
      // Check if pizza exists
      const existingPizza = await db
        .select()
        .from(pizzas)
        .where(eq(pizzas.id, id))
        .limit(1);

      if (existingPizza.length === 0) {
        return NextResponse.json(
          { error: 'Pizza not found' },
          { status: 404 }
        );
      }

      // Delete pizza toppings first
      await db.delete(pizzaToppings).where(eq(pizzaToppings.pizzaId, id));

      // Delete pizza
      await db.delete(pizzas).where(eq(pizzas.id, id));

      return NextResponse.json({
        message: 'Pizza deleted successfully'
      });
    } else if (type === 'topping') {
      // Check if topping exists
      const existingTopping = await db
        .select()
        .from(toppings)
        .where(eq(toppings.id, id))
        .limit(1);

      if (existingTopping.length === 0) {
        return NextResponse.json(
          { error: 'Topping not found' },
          { status: 404 }
        );
      }

      // Delete pizza toppings that use this topping
      await db.delete(pizzaToppings).where(eq(pizzaToppings.toppingId, id));

      // Delete topping
      await db.delete(toppings).where(eq(toppings.id, id));

      return NextResponse.json({
        message: 'Topping deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "pizza" or "topping"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
