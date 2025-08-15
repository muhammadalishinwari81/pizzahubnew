'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Redirect based on role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'MANAGER':
          router.push('/manager');
          break;
        case 'STAFF':
          router.push('/staff');
          break;
        case 'CASHIER':
          router.push('/cashier');
          break;
        case 'CUSTOMER':
          router.push('/customer');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-600 mb-4">🍕 SH Pizza</h1>
          <p className="text-xl text-gray-600 mb-8">
            Delicious pizzas delivered to your doorstep
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Welcome to SH Pizza</h2>
          <p className="text-gray-600 mb-6">
            Our online pizza ordering system is ready! Sign in to access your dashboard.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-block bg-white text-red-600 border-2 border-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">🍕 Fresh Ingredients</h3>
            <p className="text-gray-600">Made with the finest ingredients and authentic recipes.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">⚡ Fast Delivery</h3>
            <p className="text-gray-600">Quick delivery to your location with real-time tracking.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">🎯 Easy Ordering</h3>
            <p className="text-gray-600">Simple online ordering system with multiple payment options.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
