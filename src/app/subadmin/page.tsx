import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResolvedOrderForDate } from "@/lib/overrideHelper";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SubAdminDashboardClient } from "@/components/SubAdminDashboardClient";

export default async function SubAdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "SUB_ADMIN") {
    redirect("/login?error=Unauthorized");
  }

  const subAdminId = (session.user as any).id;

  // 1. Fetch routes owned by this sub admin
  const routes = await prisma.route.findMany({
    where: { subAdminId },
    select: { id: true, name: true, description: true },
    orderBy: { name: "asc" },
  });

  const routeIds = routes.map((r) => r.id);

  // 2. Fetch route assignments for these routes to get customers
  const assignments = await prisma.routeAssignment.findMany({
    where: { routeId: { in: routeIds } },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          wallet: { select: { balance: true } },
          subscriptions: {
            where: { status: "ACTIVE" },
            include: {
              items: {
                include: { product: { select: { name: true, emoji: true, size: true } } },
              },
            },
          },
        },
      },
      route: { select: { name: true } },
    },
  });

  // Deduplicate customers (in case customer assigned to multiple sequences)
  const customerMap: Record<string, { id: string; name: string; email: string; walletBalance: number; hasActiveSub: boolean; routeName: string }> = {};

  assignments.forEach((a) => {
    const c = a.customer;
    const activeSub = c.subscriptions[0];
    customerMap[c.id] = {
      id: c.id,
      name: c.name,
      email: c.email,
      walletBalance: c.wallet?.balance || 0,
      hasActiveSub: !!activeSub,
      routeName: a.route.name,
    };
  });

  const customersList = Object.values(customerMap);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // 3. Aggregate demand forecast for tomorrow for this sub admin's customers (taking resolved items into account)
  const forecastMap: Record<string, { productName: string; emoji: string; size: string; totalQuantity: number }> = {};
  
  for (const customer of customersList) {
    const resolvedItems = await getResolvedOrderForDate(customer.id, tomorrow);
    
    // Update the customer's hasActiveSub for tomorrow's forecast run
    customer.hasActiveSub = resolvedItems.length > 0;

    for (const item of resolvedItems) {
      const key = item.productId;
      if (!forecastMap[key]) {
        forecastMap[key] = {
          productName: item.name,
          emoji: item.emoji,
          size: item.size,
          totalQuantity: 0,
        };
      }
      forecastMap[key].totalQuantity += item.quantity;
    }
  }

  const forecast = Object.values(forecastMap);

  const stats = {
    totalCustomers: customersList.length,
    totalRoutes: routes.length,
    activeDeliveriesCount: customersList.filter((c) => c.hasActiveSub).length,
  };

  return (
    <>
      <DashboardHeader role="Vendor Sub-Admin" />
      <SubAdminDashboardClient
        subAdminId={subAdminId}
        stats={stats}
        routes={routes}
        customers={customersList}
        forecast={forecast}
      />
    </>
  );
}
