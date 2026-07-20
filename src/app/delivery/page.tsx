import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResolvedOrderForDate } from "@/lib/overrideHelper";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DeliveryDashboardClient } from "@/components/DeliveryDashboardClient";

export default async function DeliveryDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "DELIVERY_PERSON") {
    redirect("/login?error=Unauthorized");
  }

  const deliveryPersonId = (session.user as any).id;

  // Fetch delivery person details
  const deliveryPerson = await prisma.user.findUnique({
    where: { id: deliveryPersonId },
    select: { name: true, email: true },
  });

  // 1. Fetch all route assignments for this delivery person
  const assignments = await prisma.routeAssignment.findMany({
    where: { deliveryPersonId },
    include: {
      route: {
        select: { id: true, name: true, description: true },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          wallet: {
            select: { balance: true },
          },
        },
      },
    },
    orderBy: { sequence: "asc" },
  });

  // Unique routes assigned to this delivery person
  const routesMap = new Map<string, { id: string; name: string; description: string | null }>();
  assignments.forEach((a) => {
    if (a.route) {
      routesMap.set(a.route.id, a.route);
    }
  });
  const routes = Array.from(routesMap.values());
  const primaryRoute = routes[0] || null;

  // 2. Resolve today's products and status for each assigned customer
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const customers = await Promise.all(
    assignments.map(async (a) => {
      const customerId = a.customer.id;

      // Check pause
      const isPaused = await prisma.dailyPause.findUnique({
        where: {
          customerId_pauseDate: {
            customerId,
            pauseDate: todayStart,
          },
        },
      });

      // Check vacation
      const isVacation = await prisma.vacation.findFirst({
        where: {
          customerId,
          startDate: { lte: todayStart },
          endDate: { gte: todayStart },
        },
      });

      const resolvedItems = await getResolvedOrderForDate(customerId, today);
      const subscriptionItems = resolvedItems.map((item) => ({
        product: {
          name: item.name,
          emoji: item.emoji,
          size: item.size,
          price: item.price,
        },
        quantity: item.quantity,
        isOverride: item.isOverride,
      }));

      return {
        id: a.customer.id,
        name: a.customer.name,
        email: a.customer.email,
        phone: a.customer.phone,
        address: a.customer.address,
        sequence: a.sequence,
        routeName: a.route?.name || "Assigned Route",
        routeId: a.route?.id || "",
        walletBalance: a.customer.wallet?.balance || 0,
        accountStatus: a.customer.status || "ACTIVE",
        isPaused: !!isPaused,
        isVacation: !!isVacation,
        subscriptionItems,
      };
    })
  );

  // 3. Fetch today's already-completed deliveries for persistence
  const todayDeliveries = await prisma.delivery.findMany({
    where: {
      deliveryPersonId,
      deliveredAt: { gte: todayStart },
    },
    select: { id: true, customerId: true, deliveredAt: true },
  });

  const completedCustomerIds = todayDeliveries.map((d) => d.customerId);

  // 4. Fetch delivery history logs for Delivery History Tab
  const deliveryHistoryLogs = await prisma.delivery.findMany({
    where: { deliveryPersonId },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, address: true },
      },
    },
    orderBy: { deliveredAt: "desc" },
    take: 100,
  });

  return (
    <>
      <DashboardHeader role="Delivery" />
      <DeliveryDashboardClient
        deliveryPersonId={deliveryPersonId}
        deliveryPersonName={deliveryPerson?.name || "Delivery Partner"}
        route={primaryRoute}
        routes={routes}
        customers={customers}
        completedCustomerIds={completedCustomerIds}
        deliveryHistoryLogs={deliveryHistoryLogs}
      />
    </>
  );
}

