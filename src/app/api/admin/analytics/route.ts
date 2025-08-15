import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, users, branches } from '@/lib/db/schema';
import { eq, gte, desc, sql, and } from 'drizzle-orm';

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total orders in date range
    const totalOrdersResult = await db
      .select({ count: orders.id })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const totalOrders = totalOrdersResult.length;

    // Get total revenue in date range
    const totalRevenueResult = await db
      .select({ total: orders.totalAmount })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const totalRevenue = totalRevenueResult.reduce((sum, order) => sum + Number(order.total), 0);

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get orders by status
    const ordersByStatusResult = await db
      .select({ status: orders.status, count: orders.id })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const ordersByStatus: Record<string, number> = {};
    ordersByStatusResult.forEach((order) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Get revenue by month (last 6 months)
    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthRevenueResult = await db
        .select({ total: orders.totalAmount })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, monthStart),
            gte(monthEnd, orders.createdAt)
          )
        );

      const monthRevenue = monthRevenueResult.reduce((sum, order) => sum + Number(order.total), 0);
      
      revenueByMonth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
      });
    }

    // Get top performing branches
    const topBranchesResult = await db
      .select({
        branchId: orders.branchId,
        totalAmount: orders.totalAmount,
        orderId: orders.id,
      })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    const branchStats: Record<string, { orders: number; revenue: number }> = {};
    topBranchesResult.forEach((order) => {
      if (order.branchId) {
        if (!branchStats[order.branchId]) {
          branchStats[order.branchId] = { orders: 0, revenue: 0 };
        }
        branchStats[order.branchId].orders += 1;
        branchStats[order.branchId].revenue += Number(order.totalAmount);
      }
    });

    // Get branch names
    const branchIds = Object.keys(branchStats);
    const branchNames = await db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where(sql`${branches.id} = ANY(${branchIds})`);

    const topBranches = Object.entries(branchStats)
      .map(([branchId, stats]) => {
        const branch = branchNames.find(b => b.id === branchId);
        return {
          name: branch?.name || 'Unknown Branch',
          orders: stats.orders,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get recent orders with customer information
    const recentOrdersResult = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        customerId: orders.customerId,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Get customer emails for recent orders
    const customerIds = recentOrdersResult.map(order => order.customerId);
    const customers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(sql`${users.id} = ANY(${customerIds})`);

    const recentOrders = recentOrdersResult.map(order => {
      const customer = customers.find(c => c.id === order.customerId);
      return {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        customerEmail: customer?.email || 'Unknown',
      };
    });

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      revenueByMonth,
      topBranches,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
