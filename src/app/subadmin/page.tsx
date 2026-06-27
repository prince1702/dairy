import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SubAdminDashboardClient } from "@/components/SubAdminDashboardClient";

export default async function SubAdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "SUB_ADMIN") {
    redirect("/login?error=Unauthorized");
  }

  const totalCustomers = await prisma.user.count({
    where: { role: "CUSTOMER" },
  });

  const totalRoutes = await prisma.route.count();

  const activeDeliveriesCount = await prisma.subscription.count({
    where: { status: "ACTIVE" },
  });

  const routes = await prisma.route.findMany({
    select: { id: true, name: true, description: true },
  });

  const stats = {
    totalCustomers,
    totalRoutes,
    activeDeliveriesCount,
  };

  return (
    <>
      <DashboardHeader role="Vendor Sub-Admin" />
      <SubAdminDashboardClient stats={stats} routes={routes} />
    </>
  );
}
