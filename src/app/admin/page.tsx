import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResolvedOrderForDate } from "@/lib/overrideHelper";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login?error=Unauthorized");
  }

  // 1. Fetch system-wide KPIs
  const totalCustomers = await prisma.user.count({
    where: { role: "CUSTOMER" },
  });

  const wallets = await prisma.wallet.findMany({
    select: { balance: true },
  });
  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const pendingRechargesCount = await prisma.paymentRequest.count({
    where: { status: "PENDING" },
  });

  const activeSubscriptionsCount = await prisma.subscription.count({
    where: { status: "ACTIVE" },
  });

  // 2. Calculate Daily Demand Forecast (Grouped sum of tomorrow's resolved quantities)
  const activeCustomers = await prisma.user.findMany({
    where: { role: "CUSTOMER", status: "ACTIVE" },
    select: { id: true },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const forecastMap: Record<string, { name: string; emoji: string; size: string; total: number }> = {};
  for (const customer of activeCustomers) {
    const resolvedItems = await getResolvedOrderForDate(customer.id, tomorrow);
    for (const item of resolvedItems) {
      const key = item.productId;
      if (!forecastMap[key]) {
        forecastMap[key] = {
          name: item.name,
          emoji: item.emoji,
          size: item.size,
          total: 0,
        };
      }
      forecastMap[key].total += item.quantity;
    }
  }

  const forecast = Object.values(forecastMap).map((f) => ({
    productName: f.name,
    emoji: f.emoji,
    size: f.size,
    totalQuantity: f.total,
  }));

  // 3. Fetch all products
  const products = await prisma.product.findMany({
    orderBy: { category: "asc" },
  });

  // 4. Fetch recent system-wide transactions
  const recentTransactions = await prisma.walletTransaction.findMany({
    include: {
      wallet: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 30,
  });

  // 5. Fetch all users for User Management panel
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 6. Compute Enriched Reports Suite (Today, Yesterday, Last 7 Days, Last 30 Days)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // A. Customer status counts
  const activeCustCount = await prisma.user.count({ where: { role: "CUSTOMER", status: "ACTIVE" } });
  const inactiveCustCount = await prisma.user.count({ where: { role: "CUSTOMER", status: "INACTIVE" } });
  
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  tomorrowDate.setHours(0, 0, 0, 0);

  const pausedCustCount = await prisma.dailyPause.count({ where: { pauseDate: todayStart } });
  const vacationCustCount = await prisma.vacation.count({
    where: { startDate: { lte: todayStart }, endDate: { gte: todayStart } },
  });

  const cancelledCustCount = await prisma.subscription.count({
    where: { status: "CANCELLED" },
  });

  // B. Today's resolved milk/products sales from completed deliveries
  const todayDeliveries = await prisma.delivery.findMany({
    where: { deliveredAt: { gte: todayStart } },
    select: { itemsSnapshot: true },
  });

  const productsSoldToday: Record<string, number> = {};
  todayDeliveries.forEach((d) => {
    try {
      const items = JSON.parse(d.itemsSnapshot);
      items.forEach((item: any) => {
        productsSoldToday[item.name] = (productsSoldToday[item.name] || 0) + item.quantity;
      });
    } catch (e) {}
  });

  // C. Revenue Report by periods (calculated only from completed deliveries)
  const allDeliveries = await prisma.delivery.findMany({
    select: { totalCost: true, deliveredAt: true },
  });

  let revenueToday = 0;
  let revenueYesterday = 0;
  let revenueWeekly = 0;
  let revenueMonthly = 0;
  let revenueTotal = 0;

  allDeliveries.forEach((d) => {
    const cost = d.totalCost;
    revenueTotal += cost;
    if (d.deliveredAt >= todayStart) {
      revenueToday += cost;
    }
    if (d.deliveredAt >= yesterdayStart && d.deliveredAt < todayStart) {
      revenueYesterday += cost;
    }
    if (d.deliveredAt >= sevenDaysAgo) {
      revenueWeekly += cost;
    }
    if (d.deliveredAt >= thirtyDaysAgo) {
      revenueMonthly += cost;
    }
  });

  // D. Delivery Performance and Counts
  const totalAssignmentsCount = await prisma.routeAssignment.count();
  const completedDeliveriesCount = await prisma.delivery.count({
    where: { deliveredAt: { gte: todayStart }, status: "DELIVERED" },
  });
  const issueDeliveriesCount = await prisma.delivery.count({
    where: { deliveredAt: { gte: todayStart }, status: "ISSUE_REPORTED" },
  });
  const pendingDeliveriesCount = Math.max(0, totalAssignmentsCount - completedDeliveriesCount - issueDeliveriesCount);

  // E. Wallet collections
  const rechargesToday = await prisma.walletTransaction.aggregate({
    _sum: { changeAmount: true },
    where: { source: "RECHARGE", timestamp: { gte: todayStart } },
  });
  const deductionsToday = await prisma.walletTransaction.aggregate({
    _sum: { changeAmount: true },
    where: { source: "DELIVERY_DEDUCTION", timestamp: { gte: todayStart } },
  });

  // F. Customer Growth Reports
  const growthToday = await prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: todayStart } } });
  const growthWeekly = await prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: sevenDaysAgo } } });
  const growthMonthly = await prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } } });

  // G. Delivery boys performance
  const dbPersons = await prisma.user.findMany({
    where: { role: "DELIVERY_PERSON" },
    select: {
      id: true,
      name: true,
      deliveredRoutes: {
        select: {
          route: { select: { name: true } },
          customer: { select: { id: true } },
        },
      },
    },
  });

  const deliveryBoyPerformance = await Promise.all(
    dbPersons.map(async (dp) => {
      const assignedCount = dp.deliveredRoutes.length;
      const assignedCustIds = dp.deliveredRoutes.map((ra) => ra.customer.id);
      const completedCount = await prisma.delivery.count({
        where: {
          deliveryPersonId: dp.id,
          deliveredAt: { gte: todayStart },
          status: "DELIVERED",
        },
      });
      const issueCount = await prisma.delivery.count({
        where: {
          deliveryPersonId: dp.id,
          deliveredAt: { gte: todayStart },
          status: "ISSUE_REPORTED",
        },
      });

      const pendingCount = Math.max(0, assignedCount - completedCount - issueCount);
      const completionPct = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
      const assignedRouteName = dp.deliveredRoutes[0]?.route?.name || "No Route Assigned";

      return {
        name: dp.name,
        assignedCount,
        completedCount,
        pendingCount,
        issueCount,
        completionPct,
        routeName: assignedRouteName,
      };
    })
  );

  const pastTransactions = await prisma.walletTransaction.findMany({
    where: { timestamp: { gte: thirtyDaysAgo } },
    select: { source: true, changeAmount: true, timestamp: true },
  });

  const revenueByDayMap: Record<string, number> = {};
  const collectionByDayMap: Record<string, number> = {};

  pastTransactions.forEach((tx) => {
    const day = new Date(tx.timestamp).toISOString().split("T")[0];
    if (tx.source === "DELIVERY_DEDUCTION") {
      revenueByDayMap[day] = (revenueByDayMap[day] || 0) + Math.abs(tx.changeAmount);
    } else if (tx.source === "RECHARGE") {
      collectionByDayMap[day] = (collectionByDayMap[day] || 0) + tx.changeAmount;
    }
  });

  const revenueReport = Object.entries(revenueByDayMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const collectionReport = Object.entries(collectionByDayMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const pastCustomers = await prisma.user.findMany({
    where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const customerGrowthMap: Record<string, number> = {};
  pastCustomers.forEach((c) => {
    const day = new Date(c.createdAt).toISOString().split("T")[0];
    customerGrowthMap[day] = (customerGrowthMap[day] || 0) + 1;
  });

  const customerGrowthReport = Object.entries(customerGrowthMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const pastDeliveries = await prisma.delivery.findMany({
    where: { deliveredAt: { gte: thirtyDaysAgo } },
    select: { status: true, deliveredAt: true },
  });

  const deliveryPerfMap: Record<string, { delivered: number; issueReported: number }> = {};
  pastDeliveries.forEach((d) => {
    const day = new Date(d.deliveredAt).toISOString().split("T")[0];
    if (!deliveryPerfMap[day]) {
      deliveryPerfMap[day] = { delivered: 0, issueReported: 0 };
    }
    if (d.status === "DELIVERED") deliveryPerfMap[day].delivered += 1;
    else if (d.status === "ISSUE_REPORTED") deliveryPerfMap[day].issueReported += 1;
  });

  const deliveryPerformanceReport = Object.entries(deliveryPerfMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const reports = {
    revenue: revenueReport,
    collection: collectionReport,
    customerGrowth: customerGrowthReport,
    deliveryPerformance: deliveryPerformanceReport,
    customerStats: {
      total: totalCustomers,
      active: activeCustCount,
      inactive: inactiveCustCount,
      paused: pausedCustCount,
      vacation: vacationCustCount,
      cancelled: cancelledCustCount,
    },
    milkSales: Object.entries(productsSoldToday).map(([name, qty]) => ({ name, qty })),
    revenueStats: {
      today: revenueToday,
      yesterday: revenueYesterday,
      weekly: revenueWeekly,
      monthly: revenueMonthly,
      total: revenueTotal,
    },
    deliveryStats: {
      total: totalAssignmentsCount,
      completed: completedDeliveriesCount,
      pending: pendingDeliveriesCount,
      failed: issueDeliveriesCount,
      completionPct: totalAssignmentsCount > 0 ? Math.round((completedDeliveriesCount / totalAssignmentsCount) * 100) : 0,
    },
    walletCollection: {
      total: totalWalletBalance,
      rechargesToday: rechargesToday._sum.changeAmount || 0,
      deductionsToday: Math.abs(deductionsToday._sum.changeAmount || 0),
    },
    customerGrowthStats: {
      today: growthToday,
      weekly: growthWeekly,
      monthly: growthMonthly,
    },
    deliveryBoyPerformance,
  };

  const stats = {
    totalCustomers,
    totalWalletBalance,
    pendingRechargesCount,
    activeSubscriptionsCount,
  };

  return (
    <>
      <DashboardHeader role="Admin" />
      <AdminDashboardClient
        stats={stats}
        forecast={forecast}
        products={products}
        recentTransactions={recentTransactions as any}
        allUsers={allUsers}
        reports={reports as any}
      />
    </>
  );
}
