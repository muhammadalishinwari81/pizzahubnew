'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getRoleBasedRedirect = () => {
    switch (session.user.role) {
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'STAFF':
        return '/staff';
      case 'CASHIER':
        return '/cashier';
      case 'CUSTOMER':
        return '/customer';
      default:
        return '/auth/signin';
    }
  };

  const handleRoleRedirect = () => {
    router.push(getRoleBasedRedirect());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to SH Pizza</h1>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
              {session.user.branchId && (
                <p><strong>Branch ID:</strong> {session.user.branchId}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <button
              onClick={handleRoleRedirect}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              Go to {session.user.role.toLowerCase()} dashboard
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Phase 1 Complete!</h3>
            <p className="text-blue-800">
              Authentication system is now set up with role-based access control. 
              The database schema is ready for the pizza ordering system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
