import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

  // 3. Fetch customers list with their wallet balance
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      wallet: {
        select: { balance: true },
      },
    },
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
      />
    </>
  );
}
