import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ManagerDashboardClient } from "@/components/ManagerDashboardClient";

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "MANAGER") {
    redirect("/login?error=Unauthorized");
  }

  const managerId = (session.user as any).id;

  // 1. Fetch pending requests
  const pendingRequests = await prisma.paymentRequest.findMany({
    where: { status: "PENDING" },
    include: {
      customer: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch processed requests (Approved / Rejected)
  const processedRequests = await prisma.paymentRequest.findMany({
    where: { status: { in: ["APPROVED", "REJECTED"] } },
    include: {
      customer: {
        select: { name: true, email: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20, // Only show last 20 processed requests
  });

  // 3. Fetch customers list with full details (phone, status, subscriptions, route, delivery person)
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      status: true,
      wallet: {
        select: {
          balance: true,
          transactions: {
            select: {
              id: true,
              beforeBalance: true,
              afterBalance: true,
              changeAmount: true,
              source: true,
              description: true,
              timestamp: true,
            },
            orderBy: { timestamp: "desc" },
            take: 20,
          },
        },
      },
      subscriptions: {
        select: { status: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      routeAssignments: {
        select: {
          id: true,
          route: { select: { id: true, name: true } },
          deliveryPerson: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // 4. Fetch routes with assignments
  const routes = await prisma.route.findMany({
    include: {
      assignments: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          deliveryPerson: { select: { id: true, name: true, email: true } },
        },
        orderBy: { sequence: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // 5. Fetch all delivery persons
  const deliveryPersons = await prisma.user.findMany({
    where: { role: "DELIVERY_PERSON", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // 6. Fetch customers who don't yet have a route assignment
  const unassignedCustomers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      status: "ACTIVE",
      routeAssignments: { none: {} },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <DashboardHeader role="Manager" />
      <ManagerDashboardClient
        managerId={managerId}
        pendingRequests={pendingRequests}
        processedRequests={processedRequests}
        customers={customers}
        routes={routes}
        deliveryPersons={deliveryPersons}
        unassignedCustomers={unassignedCustomers}
      />
    </>
  );
}
