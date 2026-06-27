import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DeliveryDashboardClient } from "@/components/DeliveryDashboardClient";

export default async function DeliveryDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "DELIVERY_PERSON") {
    redirect("/login?error=Unauthorized");
  }

  const deliveryPersonId = (session.user as any).id;

  // 1. Fetch route assigned to this delivery person
  const assignment = await prisma.routeAssignment.findFirst({
    where: { deliveryPersonId },
    include: {
      route: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  const route = assignment?.route || null;

  // 2. Fetch all customers assigned to this route
  let customers: any[] = [];
  if (route) {
    const assignments = await prisma.routeAssignment.findMany({
      where: { routeId: route.id, deliveryPersonId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
            subscriptions: {
              where: { status: "ACTIVE" },
              include: {
                items: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
      orderBy: { sequence: "asc" },
    });

    customers = assignments.map((a) => {
      const activeSub = a.customer.subscriptions[0];
      const subscriptionItems = activeSub
        ? activeSub.items.map((item) => ({
            product: {
              name: item.product.name,
              emoji: item.product.emoji,
              size: item.product.size,
              price: item.product.price,
            },
            quantity: item.quantity,
          }))
        : [];

      return {
        id: a.customer.id,
        name: a.customer.name,
        address: a.customer.address,
        sequence: a.sequence,
        subscriptionItems,
      };
    });
  }

  // 3. Fetch today's already-completed deliveries for this delivery person
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDeliveries = await prisma.delivery.findMany({
    where: {
      deliveryPersonId,
      deliveredAt: { gte: today },
    },
    select: { customerId: true },
  });

  const completedCustomerIds = todayDeliveries.map((d) => d.customerId);

  return (
    <>
      <DashboardHeader role="Delivery" />
      <DeliveryDashboardClient
        deliveryPersonId={deliveryPersonId}
        route={route}
        customers={customers}
        completedCustomerIds={completedCustomerIds}
      />
    </>
  );
}
