import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DailyPauseClientView } from "@/components/DailyPauseClientView";

export default async function CustomerPausePage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/login?error=Unauthorized");
  }

  const customerId = (session.user as any).id;

  // 1. Fetch customer details
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });

  if (!customer) {
    redirect("/login?error=Unauthorized");
  }

  // 2. Fetch past and current pause records
  const dailyPauses = await prisma.dailyPause.findMany({
    where: { customerId },
    orderBy: { pauseDate: "desc" },
  });

  return (
    <DailyPauseClientView
      customer={customer}
      dailyPauses={dailyPauses.map((p) => ({
        id: p.id,
        pauseDate: p.pauseDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
