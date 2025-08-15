import NextAuth from 'next-auth';
import { UserRoleType } from '@/lib/db/schema';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRoleType;
      branchId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRoleType;
    branchId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRoleType;
    branchId?: string;
  }
}
