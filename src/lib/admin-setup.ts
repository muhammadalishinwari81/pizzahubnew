import { db } from './db';
import { users } from './db/schema';
import { hashPassword } from './auth/utils';
import { UserRole, UserRoleType } from './db/schema';

/**
 * Utility function to create the first admin user
 * This should be run once to set up the initial admin account
 */
export async function createAdminUser(email: string, password: string) {
  try {
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, UserRole.ADMIN),
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return { success: false, message: 'Admin user already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const adminUser = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      // branchId is null for admin (can manage all branches)
    }).returning();

    console.log('Admin user created successfully:', adminUser[0].email);
    return { 
      success: true, 
      message: 'Admin user created successfully',
      user: {
        id: adminUser[0].id,
        email: adminUser[0].email,
        role: adminUser[0].role
      }
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, message: 'Failed to create admin user', error };
  }
}

/**
 * Utility function to create internal role users (Manager, Staff, Cashier)
 * These should only be created by existing admins
 */
export async function createInternalUser(
  email: string, 
  password: string, 
  role: 'MANAGER' | 'STAFF' | 'CASHIER',
  branchId?: string
) {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create internal user
    const newUser = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      role: role as UserRoleType,
      branchId: branchId || null,
    }).returning();

    console.log(`${role} user created successfully:`, newUser[0].email);
    return { 
      success: true, 
      message: `${role} user created successfully`,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role,
        branchId: newUser[0].branchId
      }
    };
  } catch (error) {
    console.error(`Error creating ${role} user:`, error);
    return { success: false, message: `Failed to create ${role} user`, error };
  }
}
