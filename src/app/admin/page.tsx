import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, branches, pizzas, orders, offers } from '@/lib/db/schema';
import { count, eq, and, gte } from 'drizzle-orm';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  // Get dashboard statistics
  const [
    totalUsers,
    totalBranches,
    totalPizzas,
    totalOrders,
    totalOffers,
    recentOrders
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(branches),
    db.select({ count: count() }).from(pizzas),
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(offers),
    db.select().from(orders).orderBy(orders.createdAt).limit(5)
  ]);

  const stats = [
    {
      name: 'Total Users',
      value: totalUsers[0].count,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Branches',
      value: totalBranches[0].count,
      icon: '🏪',
      color: 'bg-green-500'
    },
    {
      name: 'Menu Items',
      value: totalPizzas[0].count,
      icon: '🍕',
      color: 'bg-yellow-500'
    },
    {
      name: 'Total Orders',
      value: totalOrders[0].count,
      icon: '📦',
      color: 'bg-purple-500'
    },
    {
      name: 'Active Offers',
      value: totalOffers[0].count,
      icon: '🎁',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your pizza business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">👥</span>
              <div>
                <h3 className="font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600">Add, edit, or deactivate user accounts</p>
              </div>
            </a>
            
            <a
              href="/admin/branches"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">🏪</span>
              <div>
                <h3 className="font-medium text-gray-900">Manage Branches</h3>
                <p className="text-sm text-gray-600">Configure branch locations and settings</p>
              </div>
            </a>
            
            <a
              href="/admin/menu"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">🍕</span>
              <div>
                <h3 className="font-medium text-gray-900">Manage Menu</h3>
                <p className="text-sm text-gray-600">Add or edit pizza items and toppings</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
        </div>
        <div className="p-6">
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${order.totalAmount}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
}
