import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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

  // 2. Calculate Daily Demand Forecast (Grouped sum of active subscription quantities)
  const activeSubItems = await prisma.subscriptionItem.findMany({
    where: {
      subscription: { status: "ACTIVE" },
    },
    include: {
      product: {
        select: { name: true, emoji: true, size: true },
      },
    },
  });

  // Aggregate quantities by product name
  const forecastMap: Record<string, { name: string; emoji: string; size: string; total: number }> = {};
  activeSubItems.forEach((item) => {
    const key = `${item.productId}`;
    if (!forecastMap[key]) {
      forecastMap[key] = {
        name: item.product.name,
        emoji: item.product.emoji,
        size: item.product.size,
        total: 0,
      };
    }
    forecastMap[key].total += item.quantity;
  });

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

  // 6. Compute 30-Day Reports Suite
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
        reports={reports}
      />
    </>
  );
}
