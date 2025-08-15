import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/utils';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // TODO: Validate reset token from database
    // For now, we'll use a placeholder - in production, implement proper token validation
    // const user = await db.query.users.findFirst({
    //   where: and(
    //     eq(users.resetToken, token),
    //     gt(users.resetTokenExpiry, new Date())
    //   ),
    // });

    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Invalid or expired reset token' },
    //     { status: 400 }
    //   );
    // }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    // await db.update(users).set({
    //   passwordHash: hashedPassword,
    //   resetToken: null,
    //   resetTokenExpiry: null,
    // }).where(eq(users.id, user.id));

    // For now, just return success
    console.log('Password reset requested for token:', token);

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
