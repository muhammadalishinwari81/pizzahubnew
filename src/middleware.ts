import { auth } from '@/lib/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'];
  if (publicRoutes.includes(nextUrl.pathname)) {
    return null;
  }

  // If not logged in, redirect to signin
  if (!isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', nextUrl));
  }

  // Role-based route protection
  const userRole = req.auth?.user?.role as string;

  // Admin routes - only ADMIN can access
  if (nextUrl.pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN') {
      return Response.redirect(new URL('/auth/signin', nextUrl));
    }
  }

  // Manager routes - MANAGER and ADMIN can access
  if (nextUrl.pathname.startsWith('/manager')) {
    if (!['MANAGER', 'ADMIN'].includes(userRole)) {
      return Response.redirect(new URL('/auth/signin', nextUrl));
    }
  }

  // Staff routes - STAFF, MANAGER, and ADMIN can access
  if (nextUrl.pathname.startsWith('/staff')) {
    if (!['STAFF', 'MANAGER', 'ADMIN'].includes(userRole)) {
      return Response.redirect(new URL('/auth/signin', nextUrl));
    }
  }

  // Cashier routes - CASHIER, MANAGER, and ADMIN can access
  if (nextUrl.pathname.startsWith('/cashier')) {
    if (!['CASHIER', 'MANAGER', 'ADMIN'].includes(userRole)) {
      return Response.redirect(new URL('/auth/signin', nextUrl));
    }
  }

  // Customer routes - only CUSTOMER can access
  if (nextUrl.pathname.startsWith('/customer')) {
    if (userRole !== 'CUSTOMER') {
      return Response.redirect(new URL('/auth/signin', nextUrl));
    }
  }

  return null;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
